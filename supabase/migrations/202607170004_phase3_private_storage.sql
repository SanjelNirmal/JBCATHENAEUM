-- JBC ATHENAEUM Phase 3: private Storage, upload sessions, validation gates,
-- and service-only database boundaries used by Supabase Edge Functions.

begin;

do $$
begin
  create type public.account_status as enum ('active', 'suspended', 'disabled');
exception when duplicate_object then null;
end
$$;

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active';

do $$
begin
  create type public.upload_session_status as enum (
    'issued', 'validating', 'submitted', 'failed', 'cancelled', 'expired', 'published'
  );
exception when duplicate_object then null;
end
$$;

-- New Storage resources no longer duplicate academic labels or permanent URLs.
-- Legacy rows keep their values until their files are migrated and verified.
alter table public.resources alter column faculty drop not null;
alter table public.resources alter column semester drop not null;
alter table public.resources alter column subject drop not null;
alter table public.resources alter column author_name drop not null;
alter table public.resources alter column file_url drop not null;

-- Phase 3 closes the legacy browser import bypass. Existing imported rows stay
-- readable, but every new file must use quarantine and review.
revoke execute on function public.import_legacy_resource(
  text, text, text, text, text, text, text, text
) from authenticated;

create table public.storage_settings (
  singleton boolean primary key default true check (singleton),
  max_upload_bytes bigint not null default 26214400,
  signed_download_seconds integer not null default 300,
  upload_session_minutes integer not null default 120,
  updated_at timestamptz not null default now(),
  constraint storage_settings_max_upload check (max_upload_bytes between 1048576 and 52428800),
  constraint storage_settings_download_ttl check (signed_download_seconds between 60 and 900),
  constraint storage_settings_session_ttl check (upload_session_minutes between 15 and 180)
);

insert into public.storage_settings (singleton) values (true)
on conflict (singleton) do nothing;

create trigger storage_settings_set_updated_at
before update on public.storage_settings
for each row execute function public.set_updated_at();

-- Storage policies are permissive when combined. Abort rather than silently
-- deploying private buckets into a project with unreviewed global policies.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
  ) then
    raise exception using
      errcode = '55000',
      message = 'Existing storage.objects policies require owner review before Phase 3 can be applied';
  end if;
end
$$;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
) values
  ('resource-quarantine', 'resource-quarantine', false, 26214400, array['application/pdf']),
  ('resource-published', 'resource-published', false, 26214400, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.resource_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  version_id uuid not null references public.resource_versions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'resource-quarantine',
  storage_path text not null,
  original_filename text not null,
  declared_mime_type text not null,
  expected_byte_size bigint not null,
  status public.upload_session_status not null default 'issued',
  expires_at timestamptz not null,
  completed_at timestamptz,
  promoted_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  unique (version_id),
  constraint upload_sessions_bucket_check check (storage_bucket = 'resource-quarantine'),
  constraint upload_sessions_filename_check check (
    length(original_filename) between 5 and 200
    and original_filename !~ '[\\/]'
    and lower(right(original_filename, 4)) = '.pdf'
  ),
  constraint upload_sessions_mime_check check (declared_mime_type = 'application/pdf'),
  constraint upload_sessions_size_positive check (expected_byte_size > 0),
  constraint upload_sessions_expiry_check check (expires_at > created_at)
);

create trigger resource_upload_sessions_set_updated_at
before update on public.resource_upload_sessions
for each row execute function public.set_updated_at();

create index upload_sessions_user_created_idx
  on public.resource_upload_sessions(user_id, created_at desc);
create index upload_sessions_cleanup_idx
  on public.resource_upload_sessions(status, expires_at)
  where status in (
    'issued'::public.upload_session_status,
    'failed'::public.upload_session_status,
    'cancelled'::public.upload_session_status,
    'expired'::public.upload_session_status
  );

create unique index resource_versions_unique_clean_checksum
  on public.resource_versions(sha256_checksum)
  where sha256_checksum is not null
    and scan_status = 'clean'::public.resource_scan_status;

alter table public.storage_settings enable row level security;
alter table public.storage_settings force row level security;
alter table public.resource_upload_sessions enable row level security;
alter table public.resource_upload_sessions force row level security;

create policy storage_settings_admin_read on public.storage_settings
for select to authenticated using (public.is_platform_admin());

create policy upload_sessions_owner_read on public.resource_upload_sessions
for select to authenticated using (user_id = auth.uid());
create policy upload_sessions_review_team_read on public.resource_upload_sessions
for select to authenticated using (
  public.has_role('moderator'::public.app_role) or public.is_platform_admin()
);

revoke all on table public.storage_settings from anon, authenticated;
grant select on table public.storage_settings to authenticated;
revoke all on table public.resource_upload_sessions from anon, authenticated;
grant select (
  id, resource_id, version_id, user_id, original_filename, expected_byte_size,
  status, expires_at, completed_at, promoted_at, failure_code, created_at, updated_at
) on public.resource_upload_sessions to authenticated;

create or replace function public.create_resource_upload_session(
  request_user_id uuid,
  target_campus_id uuid,
  target_program_id uuid,
  target_curriculum_version_id uuid,
  target_term_id uuid,
  target_subject_id uuid,
  target_category_id uuid,
  resource_title text,
  resource_description text,
  resource_academic_year integer,
  original_file_name text,
  declared_mime_type text,
  expected_bytes bigint,
  existing_resource_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  resource_id_value uuid := gen_random_uuid();
  version_id_value uuid := gen_random_uuid();
  session_id_value uuid := gen_random_uuid();
  max_bytes bigint;
  session_minutes integer;
  upload_path text;
  contributor_name text;
  resource_record public.resources%rowtype;
  version_number_value integer := 1;
  audit_action text := 'resource.upload_issued';
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if request_user_id is null or not exists (
    select 1
    from auth.users
    join public.profiles on profiles.id = auth.users.id
    where auth.users.id = request_user_id
      and auth.users.email_confirmed_at is not null
      and coalesce(profiles.account_status::text, 'active') = 'active'
  ) then
    raise exception using errcode = '42501', message = 'A verified active account is required';
  end if;

  select max_upload_bytes, upload_session_minutes
  into max_bytes, session_minutes
  from public.storage_settings where singleton;

  if resource_title is null or length(trim(resource_title)) not between 3 and 240
     or resource_description is null or length(trim(resource_description)) not between 10 and 5000
     or resource_academic_year is not null and resource_academic_year not between 1959 and 2200
     or original_file_name is null or length(original_file_name) not between 5 and 200
     or original_file_name ~ '[\\/]'
     or lower(right(original_file_name, 4)) <> '.pdf'
     or declared_mime_type <> 'application/pdf'
     or expected_bytes <= 0 or expected_bytes > max_bytes then
    raise exception using errcode = '22023', message = 'Upload metadata is invalid';
  end if;

  if not exists (
    select 1
    from public.programs
    join public.curriculum_versions
      on curriculum_versions.id = target_curriculum_version_id
     and curriculum_versions.program_id = programs.id
    join public.terms
      on terms.id = target_term_id
     and terms.program_id = programs.id
     and terms.curriculum_version_id = curriculum_versions.id
    join public.subjects
      on subjects.id = target_subject_id
     and subjects.program_id = programs.id
     and subjects.curriculum_version_id = curriculum_versions.id
     and subjects.term_id = terms.id
    join public.resource_categories
      on resource_categories.id = target_category_id
     and resource_categories.campus_id = programs.campus_id
    join public.campuses on campuses.id = programs.campus_id
    where campuses.id = target_campus_id
      and programs.id = target_program_id
      and campuses.is_active
      and programs.is_active
      and curriculum_versions.is_active
      and terms.is_active
      and subjects.is_active
      and resource_categories.is_active
  ) then
    raise exception using errcode = '23503', message = 'Academic selection is invalid or inactive';
  end if;

  if existing_resource_id is not null then
    select * into resource_record
    from public.resources
    where id = existing_resource_id
    for update;
    if not found then
      raise exception using errcode = 'P0002', message = 'Resource for resubmission was not found';
    end if;
    if resource_record.owner_id <> request_user_id then
      raise exception using errcode = '42501', message = 'Only the resource owner may resubmit';
    end if;
    if resource_record.status not in (
      'changes_requested'::public.resource_status,
      'rejected'::public.resource_status
    ) then
      raise exception using errcode = '23514', message = 'Resource is not eligible for resubmission';
    end if;
    if exists (
      select 1 from public.resource_upload_sessions
      where resource_id = existing_resource_id
        and status in (
          'issued'::public.upload_session_status,
          'validating'::public.upload_session_status
        )
        and expires_at > now()
    ) then
      raise exception using errcode = '23505', message = 'An active resubmission already exists';
    end if;

    resource_id_value := existing_resource_id;
    select coalesce(max(version_number), 0) + 1
    into version_number_value
    from public.resource_versions
    where resource_id = resource_id_value;
    audit_action := 'resource.resubmission_issued';
  end if;

  select coalesce(nullif(trim(name), ''), 'Contributor')
  into contributor_name
  from public.profiles where id = request_user_id;
  contributor_name := coalesce(contributor_name, 'Contributor');

  upload_path := request_user_id::text || '/' || session_id_value::text || '/' || version_id_value::text || '.pdf';

  if existing_resource_id is null then
    insert into public.resources (
      id, campus_id, program_id, curriculum_version_id, term_id, subject_id,
      category_id, title, slug, description, academic_year, resource_type,
      status, owner_id, author_name
    ) values (
      resource_id_value, target_campus_id, target_program_id,
      target_curriculum_version_id, target_term_id, target_subject_id,
      target_category_id, trim(resource_title),
      public.slugify(resource_title) || '-' || left(replace(resource_id_value::text, '-', ''), 8),
      trim(resource_description), resource_academic_year, 'PDF',
      'draft'::public.resource_status, request_user_id, contributor_name
    );
  else
    update public.resources
    set campus_id = target_campus_id,
        program_id = target_program_id,
        curriculum_version_id = target_curriculum_version_id,
        term_id = target_term_id,
        subject_id = target_subject_id,
        category_id = target_category_id,
        title = trim(resource_title),
        slug = public.slugify(resource_title) || '-' || left(replace(resource_id_value::text, '-', ''), 8),
        description = trim(resource_description),
        academic_year = resource_academic_year,
        status = 'draft'::public.resource_status,
        reviewer_id = null,
        reviewed_at = null,
        archived_at = null
    where id = resource_id_value;
  end if;

  insert into public.resource_versions (
    id, resource_id, version_number, storage_bucket, storage_path,
    original_filename, safe_filename, mime_type, byte_size, uploaded_by,
    scan_status, scan_result, is_current
  ) values (
    version_id_value, resource_id_value, version_number_value, 'resource-quarantine', upload_path,
    original_file_name, version_id_value::text || '.pdf', 'application/pdf',
    expected_bytes, request_user_id, 'pending'::public.resource_scan_status,
    jsonb_build_object('validator', 'pending'), false
  );

  insert into public.resource_upload_sessions (
    id, resource_id, version_id, user_id, storage_path, original_filename,
    declared_mime_type, expected_byte_size, expires_at
  ) values (
    session_id_value, resource_id_value, version_id_value, request_user_id,
    upload_path, original_file_name, declared_mime_type, expected_bytes,
    now() + make_interval(mins => session_minutes)
  );

  insert into public.audit_events (
    campus_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    target_campus_id, request_user_id, audit_action, 'resource',
    resource_id_value,
    jsonb_build_object('session_id', session_id_value, 'version_id', version_id_value)
  );

  return jsonb_build_object(
    'session_id', session_id_value,
    'resource_id', resource_id_value,
    'version_id', version_id_value,
    'bucket', 'resource-quarantine',
    'path', upload_path,
    'expires_at', now() + make_interval(mins => session_minutes)
  );
end;
$$;

revoke all on function public.create_resource_upload_session(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, integer, text, text, bigint, uuid
) from public, anon, authenticated;
grant execute on function public.create_resource_upload_session(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, integer, text, text, bigint, uuid
) to service_role;

create or replace function public.complete_resource_upload(
  target_session_id uuid,
  request_user_id uuid,
  actual_byte_size bigint,
  checksum_sha256 text,
  detected_page_count integer,
  validation_result jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  session_record public.resource_upload_sessions%rowtype;
  submission_id_value uuid;
  campus_id_value uuid;
  previous_submission_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  select * into session_record
  from public.resource_upload_sessions
  where id = target_session_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Upload session not found'; end if;
  if session_record.user_id <> request_user_id then
    raise exception using errcode = '42501', message = 'Upload session ownership mismatch';
  end if;
  if session_record.status <> 'issued'::public.upload_session_status
     or session_record.expires_at <= now() then
    raise exception using errcode = '23514', message = 'Upload session is no longer valid';
  end if;
  if actual_byte_size <> session_record.expected_byte_size
     or checksum_sha256 !~ '^[a-f0-9]{64}$'
     or detected_page_count <= 0 then
    raise exception using errcode = '22023', message = 'Validated file metadata is invalid';
  end if;
  if exists (
    select 1 from public.resource_versions
    where sha256_checksum = checksum_sha256
      and id <> session_record.version_id
      and scan_status in (
        'clean'::public.resource_scan_status,
        'legacy_unverified'::public.resource_scan_status
      )
  ) then
    raise exception using errcode = '23505', message = 'This PDF already exists in the archive';
  end if;

  update public.resource_upload_sessions
  set status = 'validating'::public.upload_session_status
  where id = target_session_id;

  update public.resource_versions
  set byte_size = actual_byte_size,
      page_count = detected_page_count,
      sha256_checksum = checksum_sha256,
      scan_status = 'clean'::public.resource_scan_status,
      scan_result = coalesce(validation_result, '{}'::jsonb)
  where id = session_record.version_id and resource_id = session_record.resource_id;

  select id into previous_submission_id
  from public.resource_submissions
  where resource_id = session_record.resource_id
  order by created_at desc
  limit 1;

  insert into public.resource_submissions (
    resource_id, version_id, submitter_id, status, resubmission_of
  ) values (
    session_record.resource_id, session_record.version_id, request_user_id,
    'submitted'::public.submission_status, previous_submission_id
  ) returning id into submission_id_value;

  update public.resources
  set status = 'submitted'::public.resource_status
  where id = session_record.resource_id
  returning campus_id into campus_id_value;

  update public.resource_upload_sessions
  set status = 'submitted'::public.upload_session_status,
      completed_at = now(),
      failure_code = null
  where id = target_session_id;

  insert into public.notifications (
    user_id, notification_type, title, message, entity_type, entity_id
  ) values (
    request_user_id, 'resource_submitted', 'Submission received',
    'Your PDF passed automated validation and entered the review queue.',
    'resource', session_record.resource_id
  );

  insert into public.audit_events (
    campus_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    campus_id_value, request_user_id, 'resource.upload_validated', 'resource',
    session_record.resource_id,
    jsonb_build_object(
      'session_id', target_session_id,
      'submission_id', submission_id_value,
      'version_id', session_record.version_id,
      'sha256', checksum_sha256
    )
  );
  return submission_id_value;
end;
$$;

revoke all on function public.complete_resource_upload(uuid, uuid, bigint, text, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_resource_upload(uuid, uuid, bigint, text, integer, jsonb)
  to service_role;

create or replace function public.fail_resource_upload(
  target_session_id uuid,
  request_user_id uuid,
  target_status public.upload_session_status,
  supplied_failure_code text,
  validation_result jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  session_record public.resource_upload_sessions%rowtype;
  campus_id_value uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if target_status not in (
    'failed'::public.upload_session_status,
    'cancelled'::public.upload_session_status,
    'expired'::public.upload_session_status
  ) then
    raise exception using errcode = '22023', message = 'Invalid terminal upload status';
  end if;

  select * into session_record from public.resource_upload_sessions
  where id = target_session_id for update;
  if not found then return; end if;
  if session_record.user_id <> request_user_id then
    raise exception using errcode = '42501', message = 'Upload session ownership mismatch';
  end if;
  if session_record.status in (
    'submitted'::public.upload_session_status,
    'published'::public.upload_session_status
  ) then
    raise exception using errcode = '23514', message = 'Completed upload cannot be cancelled';
  end if;

  update public.resource_upload_sessions
  set status = target_status,
      failure_code = left(coalesce(supplied_failure_code, 'unknown'), 120),
      completed_at = now()
  where id = target_session_id;

  update public.resource_versions
  set scan_status = 'rejected'::public.resource_scan_status,
      scan_result = coalesce(validation_result, '{}'::jsonb)
  where id = session_record.version_id;

  update public.resources
  set status = case
    when target_status = 'cancelled'::public.upload_session_status
      then 'archived'::public.resource_status
    else 'rejected'::public.resource_status
  end,
  archived_at = case when target_status = 'cancelled'::public.upload_session_status then now() else archived_at end
  where id = session_record.resource_id
  returning campus_id into campus_id_value;

  insert into public.audit_events (
    campus_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    campus_id_value, request_user_id, 'resource.upload_' || target_status::text,
    'resource', session_record.resource_id,
    jsonb_build_object('session_id', target_session_id, 'failure_code', left(supplied_failure_code, 120))
  );
end;
$$;

revoke all on function public.fail_resource_upload(uuid, uuid, public.upload_session_status, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.fail_resource_upload(uuid, uuid, public.upload_session_status, text, jsonb)
  to service_role;

create or replace function public.increment_resource_download(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  update public.resources
  set download_count = download_count + 1
  where id = target_resource_id
    and status = 'published'::public.resource_status
    and deleted_at is null;
end;
$$;

revoke all on function public.increment_resource_download(uuid) from public, anon, authenticated;
grant execute on function public.increment_resource_download(uuid) to service_role;

comment on table public.resource_upload_sessions is
  'Short-lived server-issued upload intents. Browser clients have read-only access to their own safe status fields.';
comment on table public.storage_settings is
  'Single-row Storage limits consumed by trusted Edge Functions; update through reviewed migrations.';

commit;
