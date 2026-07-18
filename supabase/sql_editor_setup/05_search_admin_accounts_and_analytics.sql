-- JBC ATHENAEUM Phases 4-22: database-backed search/pagination, account
-- controls, analytics, removal requests, and audited administrative actions.

begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

alter table public.profiles
  add column if not exists account_status public.account_status not null default 'active',
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid references auth.users(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_suspension_reason_length;
alter table public.profiles add constraint profiles_suspension_reason_length
  check (suspension_reason is null or length(trim(suspension_reason)) between 3 and 1000);

grant select (account_status, suspended_at) on public.profiles to authenticated;

-- Privileged memberships are effective only for active AAL2 sessions. This
-- makes existing RLS policies and SECURITY DEFINER functions inherit MFA.
create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    join public.profiles on profiles.id = user_roles.user_id
    where user_roles.user_id = auth.uid()
      and user_roles.role = required_role
      and profiles.account_status = 'active'::public.account_status
      and (
        required_role not in (
          'moderator'::public.app_role,
          'admin'::public.app_role,
          'super_admin'::public.app_role
        )
        or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      )
  );
$$;

revoke all on function public.has_role(public.app_role) from public;
grant execute on function public.has_role(public.app_role) to anon, authenticated;

create or replace function public.set_user_role(
  target_user_id uuid,
  target_role public.app_role,
  should_grant boolean default true
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  actor_is_admin boolean;
  actor_is_super_admin boolean;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception using errcode = '42501', message = 'Multi-factor authentication is required';
  end if;

  actor_is_admin := public.has_role('admin'::public.app_role);
  actor_is_super_admin := public.has_role('super_admin'::public.app_role);
  if target_role in ('admin'::public.app_role, 'super_admin'::public.app_role) then
    if not actor_is_super_admin then
      raise exception using errcode = '42501', message = 'Only a super administrator can change privileged roles';
    end if;
  elsif not (actor_is_admin or actor_is_super_admin) then
    raise exception using errcode = '42501', message = 'Administrator role is required';
  end if;
  if actor = target_user_id
     and target_role in ('admin'::public.app_role, 'super_admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'Privileged self-role changes are not allowed';
  end if;
  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception using errcode = 'P0002', message = 'Target user was not found';
  end if;
  if not should_grant and target_role = 'super_admin'::public.app_role
     and (select count(*) from public.user_roles where role = 'super_admin'::public.app_role) <= 1 then
    raise exception using errcode = '23514', message = 'The final super administrator cannot be removed';
  end if;

  if should_grant then
    insert into public.user_roles (user_id, role, granted_by)
    values (target_user_id, target_role, actor)
    on conflict (user_id, role) do nothing;
  else
    delete from public.user_roles where user_id = target_user_id and role = target_role;
  end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor,
    case when should_grant then 'role.granted' else 'role.revoked' end,
    'user', target_user_id,
    jsonb_build_object('role', target_role, 'granted', should_grant, 'aal', 'aal2')
  );
end;
$$;

revoke all on function public.set_user_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;

create or replace function public.set_account_status(
  target_user_id uuid,
  next_status public.account_status,
  supplied_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare actor uuid := auth.uid();
begin
  if actor is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  if actor = target_user_id then
    raise exception using errcode = '42501', message = 'Administrators cannot change their own account status';
  end if;
  if next_status <> 'active'::public.account_status
     and coalesce(length(trim(supplied_reason)), 0) not between 3 and 1000 then
    raise exception using errcode = '22023', message = 'A suspension or disablement reason is required';
  end if;
  if exists (
    select 1 from public.user_roles
    where user_id = target_user_id and role = 'super_admin'::public.app_role
  ) and not public.has_role('super_admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'Only a super administrator can change this account';
  end if;

  update public.profiles
  set account_status = next_status,
      suspension_reason = case when next_status = 'active' then null else trim(supplied_reason) end,
      suspended_at = case when next_status = 'active' then null else now() end,
      suspended_by = case when next_status = 'active' then null else actor end
  where id = target_user_id;
  if not found then raise exception using errcode = 'P0002', message = 'Profile was not found'; end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor, 'account.status_changed', 'user', target_user_id,
    jsonb_build_object('status', next_status, 'reason', nullif(trim(supplied_reason), ''))
  );
end;
$$;

revoke all on function public.set_account_status(uuid, public.account_status, text) from public, anon;
grant execute on function public.set_account_status(uuid, public.account_status, text) to authenticated;

create or replace function public.update_user_profile_safe(
  target_user_id uuid,
  next_name text,
  next_faculty text,
  next_avatar_url text,
  next_bio text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  if length(trim(next_name)) not between 2 and 120
     or length(trim(next_faculty)) not between 2 and 160
     or coalesce(length(next_bio), 0) > 2000
     or (nullif(trim(next_avatar_url), '') is not null and trim(next_avatar_url) !~ '^https://') then
    raise exception using errcode = '22023', message = 'Safe profile fields are invalid';
  end if;
  update public.profiles
  set name = trim(next_name),
      faculty = trim(next_faculty),
      avatar_url = nullif(trim(next_avatar_url), ''),
      bio = nullif(trim(next_bio), '')
  where id = target_user_id;
  if not found then raise exception using errcode = 'P0002', message = 'Profile was not found'; end if;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'profile.safe_fields_updated', 'user', target_user_id, jsonb_build_object('fields', array['name','faculty','avatar_url','bio']));
end;
$$;
revoke all on function public.update_user_profile_safe(uuid,text,text,text,text) from public, anon;
grant execute on function public.update_user_profile_safe(uuid,text,text,text,text) to authenticated;

-- Cross-table search text is maintained by a trigger; the actual tsvector is a
-- stored generated column and is therefore indexable and deterministic.
alter table public.resources add column if not exists search_text text not null default '';
alter table public.resources add column if not exists search_vector tsvector
  generated always as (to_tsvector('simple'::regconfig, search_text)) stored;

create or replace function public.build_resource_search_text()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  program_name text;
  faculty_name text;
  term_name text;
  subject_name text;
  contributor_name text;
begin
  select programs.name, faculties.name
  into program_name, faculty_name
  from public.programs
  left join public.faculties on faculties.id = programs.faculty_id
  where programs.id = new.program_id;
  select terms.name into term_name from public.terms where terms.id = new.term_id;
  select subjects.name into subject_name from public.subjects where subjects.id = new.subject_id;
  select profiles.name into contributor_name from public.profiles where profiles.id = new.owner_id;

  new.search_text := concat_ws(' ',
    new.title, new.description, new.academic_year::text,
    program_name, faculty_name, term_name, subject_name, contributor_name,
    new.faculty, new.semester, new.subject, new.author_name
  );
  return new;
end;
$$;

revoke all on function public.build_resource_search_text() from public;
drop trigger if exists resources_build_search_text on public.resources;
create trigger resources_build_search_text
before insert or update on public.resources
for each row execute function public.build_resource_search_text();

update public.resources set search_text = search_text;

create index if not exists resources_search_vector_idx
  on public.resources using gin(search_vector);
do $$
declare trgm_schema name;
begin
  select namespaces.nspname into trgm_schema
  from pg_extension
  join pg_namespace as namespaces on namespaces.oid = pg_extension.extnamespace
  where pg_extension.extname = 'pg_trgm';
  execute format(
    'create index if not exists resources_title_trgm_idx on public.resources using gin(title %I.gin_trgm_ops)',
    trgm_schema
  );
end
$$;
create index if not exists resources_public_catalog_idx
  on public.resources(status, created_at desc)
  where deleted_at is null;
create index if not exists resources_filter_idx
  on public.resources(program_id, term_id, subject_id, category_id, academic_year);

create or replace function public.refresh_resource_search_for_academic_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_table_name = 'programs' then
    update public.resources set search_text = search_text where program_id = new.id;
  elsif tg_table_name = 'terms' then
    update public.resources set search_text = search_text where term_id = new.id;
  elsif tg_table_name = 'subjects' then
    update public.resources set search_text = search_text where subject_id = new.id;
  elsif tg_table_name = 'profiles' then
    update public.resources set search_text = search_text where owner_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.refresh_resource_search_for_academic_change() from public;
drop trigger if exists programs_refresh_resource_search on public.programs;
create trigger programs_refresh_resource_search after update of name on public.programs
for each row execute function public.refresh_resource_search_for_academic_change();
drop trigger if exists terms_refresh_resource_search on public.terms;
create trigger terms_refresh_resource_search after update of name on public.terms
for each row execute function public.refresh_resource_search_for_academic_change();
drop trigger if exists subjects_refresh_resource_search on public.subjects;
create trigger subjects_refresh_resource_search after update of name on public.subjects
for each row execute function public.refresh_resource_search_for_academic_change();
drop trigger if exists profiles_refresh_resource_search on public.profiles;
create trigger profiles_refresh_resource_search after update of name on public.profiles
for each row execute function public.refresh_resource_search_for_academic_change();

create or replace function public.search_public_resources(
  search_query text default null,
  faculty_filter uuid default null,
  program_filter uuid default null,
  term_filter uuid default null,
  subject_filter uuid default null,
  category_filter uuid default null,
  academic_year_filter integer default null,
  uploaded_from timestamptz default null,
  uploaded_to timestamptz default null,
  sort_by text default 'recent',
  page_number integer default 1,
  page_size integer default 12
)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  academic_year integer,
  resource_type text,
  program_id uuid,
  program_name text,
  faculty_id uuid,
  faculty_name text,
  term_id uuid,
  term_name text,
  subject_id uuid,
  subject_name text,
  category_id uuid,
  category_name text,
  contributor_name text,
  legacy_url text,
  byte_size bigint,
  page_count integer,
  download_count bigint,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select
    resources.id, resources.title, resources.slug, resources.description,
    resources.academic_year, resources.resource_type,
    programs.id, programs.name, faculties.id, faculties.name,
    terms.id, terms.name, subjects.id, subjects.name,
    resource_categories.id, resource_categories.name,
    coalesce(profiles.name, resources.author_name, 'Contributor'),
    resources.file_url,
    resource_versions.byte_size, resource_versions.page_count,
    resources.download_count, resources.created_at,
    count(*) over()
  from public.resources
  join public.programs on programs.id = resources.program_id and programs.is_active
  left join public.faculties on faculties.id = programs.faculty_id and faculties.is_active
  join public.terms on terms.id = resources.term_id and terms.is_active
  join public.subjects on subjects.id = resources.subject_id and subjects.is_active
  join public.resource_categories on resource_categories.id = resources.category_id and resource_categories.is_active
  join public.campuses on campuses.id = resources.campus_id and campuses.is_active
  left join public.profiles on profiles.id = resources.owner_id
  left join public.resource_versions on resource_versions.id = resources.current_version_id
  where resources.status = 'published'::public.resource_status
    and resources.deleted_at is null
    and (
      nullif(trim(search_query), '') is null
      or resources.search_vector @@ websearch_to_tsquery('simple'::regconfig, trim(search_query))
      or similarity(resources.title, trim(search_query)) >= 0.2
    )
    and (faculty_filter is null or faculties.id = faculty_filter)
    and (program_filter is null or programs.id = program_filter)
    and (term_filter is null or terms.id = term_filter)
    and (subject_filter is null or subjects.id = subject_filter)
    and (category_filter is null or resource_categories.id = category_filter)
    and (academic_year_filter is null or resources.academic_year = academic_year_filter)
    and (uploaded_from is null or resources.created_at >= uploaded_from)
    and (uploaded_to is null or resources.created_at < uploaded_to)
  order by
    case when sort_by = 'popular' then resources.download_count end desc nulls last,
    case when sort_by = 'oldest' then resources.created_at end asc nulls last,
    case when sort_by = 'title' then lower(resources.title) end asc nulls last,
    resources.created_at desc
  limit least(greatest(page_size, 1), 50)
  offset (greatest(page_number, 1) - 1) * least(greatest(page_size, 1), 50);
$$;

revoke all on function public.search_public_resources(text,uuid,uuid,uuid,uuid,uuid,integer,timestamptz,timestamptz,text,integer,integer) from public;
grant execute on function public.search_public_resources(text,uuid,uuid,uuid,uuid,uuid,integer,timestamptz,timestamptz,text,integer,integer) to anon, authenticated;

create table public.resource_download_events (
  id bigint generated always as identity primary key,
  resource_id uuid not null references public.resources(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);
create index resource_download_events_time_idx on public.resource_download_events(downloaded_at desc);
create index resource_download_events_resource_time_idx on public.resource_download_events(resource_id, downloaded_at desc);
alter table public.resource_download_events enable row level security;
alter table public.resource_download_events force row level security;
revoke all on table public.resource_download_events from public, anon, authenticated;

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
  update public.resources set download_count = download_count + 1
  where id = target_resource_id
    and status = 'published'::public.resource_status
    and deleted_at is null;
  if found then
    insert into public.resource_download_events(resource_id) values (target_resource_id);
  end if;
end;
$$;
revoke all on function public.increment_resource_download(uuid) from public, anon, authenticated;
grant execute on function public.increment_resource_download(uuid) to service_role;

create or replace function public.public_platform_stats()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'publishedResources', count(*) filter (where resources.status = 'published'::public.resource_status and resources.deleted_at is null),
    'programs', (select count(*) from public.programs where is_active),
    'subjects', (select count(*) from public.subjects where is_active),
    'downloads', coalesce(sum(resources.download_count) filter (where resources.status = 'published'::public.resource_status), 0)
  )
  from public.resources;
$$;
revoke all on function public.public_platform_stats() from public;
grant execute on function public.public_platform_stats() to anon, authenticated;

create table public.resource_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  storage_objects jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 20),
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint resource_deletion_objects_array check (jsonb_typeof(storage_objects) = 'array')
);
create index resource_deletion_jobs_cleanup_idx on public.resource_deletion_jobs(status, created_at) where status in ('pending', 'failed');
alter table public.resource_deletion_jobs enable row level security;
alter table public.resource_deletion_jobs force row level security;
create policy resource_deletion_jobs_super_admin_read on public.resource_deletion_jobs
for select to authenticated using (public.has_role('super_admin'::public.app_role));
revoke all on table public.resource_deletion_jobs from anon, authenticated;
grant select on table public.resource_deletion_jobs to authenticated;

create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare result jsonb;
begin
  if auth.uid() is null or not (
    public.has_role('moderator'::public.app_role) or public.is_platform_admin()
  ) then
    raise exception using errcode = '42501', message = 'Review role with MFA is required';
  end if;
  select jsonb_build_object(
    'publishedResources', count(*) filter (where status = 'published'::public.resource_status and deleted_at is null),
    'pendingReviews', count(*) filter (where status in ('submitted'::public.resource_status, 'under_review'::public.resource_status)),
    'changesRequested', count(*) filter (where status = 'changes_requested'::public.resource_status),
    'rejectedSubmissions', count(*) filter (where status = 'rejected'::public.resource_status),
    'flaggedResources', (select count(*) from public.resource_reports where status in ('open'::public.report_status, 'investigating'::public.report_status)),
    'failedUploads', (select count(*) from public.resource_upload_sessions where status in ('failed'::public.upload_session_status, 'expired'::public.upload_session_status)),
    'missingMetadata', count(*) filter (where campus_id is null or program_id is null or term_id is null or subject_id is null or category_id is null),
    'newUsersThisMonth', (select count(*) from public.profiles where created_at >= date_trunc('month', now())),
    'downloadsThisMonth', (select count(*) from public.resource_download_events where downloaded_at >= date_trunc('month', now())),
    'storageBytes', (select coalesce(sum(byte_size), 0) from public.resource_versions where storage_bucket in ('resource-quarantine', 'resource-published')),
    'pendingStorageCleanup', (select count(*) from public.resource_deletion_jobs where status in ('pending', 'failed'))
  ) into result from public.resources;
  return result;
end;
$$;
revoke all on function public.admin_dashboard_metrics() from public, anon;
grant execute on function public.admin_dashboard_metrics() to authenticated;

create or replace function public.update_resource_metadata(
  target_resource_id uuid,
  next_title text,
  next_description text,
  next_category_id uuid,
  next_academic_year integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare campus_value uuid;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  if length(trim(next_title)) not between 3 and 240
     or length(trim(next_description)) not between 10 and 5000
     or next_academic_year not between 1959 and 2200 then
    raise exception using errcode = '22023', message = 'Resource metadata is invalid';
  end if;
  update public.resources
  set title = trim(next_title),
      slug = public.slugify(next_title) || '-' || left(replace(id::text, '-', ''), 8),
      description = trim(next_description),
      category_id = next_category_id,
      academic_year = next_academic_year
  where id = target_resource_id
    and exists (
      select 1 from public.resource_categories
      where resource_categories.id = next_category_id
        and resource_categories.campus_id = resources.campus_id
        and resource_categories.is_active
    )
  returning campus_id into campus_value;
  if not found then raise exception using errcode = 'P0002', message = 'Resource or category was not found'; end if;
  perform public.write_audit_event(campus_value, 'resource.metadata_updated', 'resource', target_resource_id);
end;
$$;
revoke all on function public.update_resource_metadata(uuid,text,text,uuid,integer) from public, anon;
grant execute on function public.update_resource_metadata(uuid,text,text,uuid,integer) to authenticated;

create or replace function public.bulk_resource_state(
  target_resource_ids uuid[],
  requested_action text,
  supplied_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resource_id_value uuid;
  changed integer := 0;
  failures jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  if cardinality(target_resource_ids) not between 1 and 100
     or requested_action not in ('archive', 'restore')
     or coalesce(length(trim(supplied_reason)), 0) not between 3 and 1000 then
    raise exception using errcode = '22023', message = 'Bulk action input is invalid';
  end if;
  foreach resource_id_value in array target_resource_ids loop
    begin
      if requested_action = 'archive' then
        perform public.archive_resource(resource_id_value);
      else
        perform public.restore_resource(resource_id_value);
      end if;
      changed := changed + 1;
    exception when others then
      failures := failures || jsonb_build_array(jsonb_build_object('id', resource_id_value, 'error', sqlstate));
    end;
  end loop;
  insert into public.audit_events(actor_id, action, entity_type, metadata)
  values (
    auth.uid(), 'resource.bulk_' || requested_action, 'resource_batch',
    jsonb_build_object('requested', cardinality(target_resource_ids), 'changed', changed, 'reason', trim(supplied_reason), 'failures', failures)
  );
  return jsonb_build_object('requested', cardinality(target_resource_ids), 'changed', changed, 'failures', failures);
end;
$$;
revoke all on function public.bulk_resource_state(uuid[],text,text) from public, anon;
grant execute on function public.bulk_resource_state(uuid[],text,text) to authenticated;

create or replace function public.assign_resource_reviewer(
  target_submission_id uuid,
  target_reviewer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  submission_record public.resource_submissions%rowtype;
  campus_value uuid;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  select * into submission_record
  from public.resource_submissions
  where id = target_submission_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Submission was not found'; end if;
  if submission_record.status not in ('submitted'::public.submission_status, 'under_review'::public.submission_status) then
    raise exception using errcode = '23514', message = 'Submission is not assignable';
  end if;
  if submission_record.submitter_id = target_reviewer_id then
    raise exception using errcode = '42501', message = 'A submitter cannot review their own submission';
  end if;
  if not exists (
    select 1 from public.user_roles
    join public.profiles on profiles.id = user_roles.user_id
    where user_roles.user_id = target_reviewer_id
      and user_roles.role in ('moderator'::public.app_role, 'admin'::public.app_role, 'super_admin'::public.app_role)
      and profiles.account_status = 'active'::public.account_status
  ) then
    raise exception using errcode = '42501', message = 'Target reviewer is not an active reviewer';
  end if;

  update public.resource_submissions
  set status = 'under_review'::public.submission_status,
      reviewer_id = target_reviewer_id,
      review_started_at = coalesce(review_started_at, now())
  where id = target_submission_id;
  update public.resources
  set status = 'under_review'::public.resource_status,
      reviewer_id = target_reviewer_id
  where id = submission_record.resource_id
  returning campus_id into campus_value;
  perform public.write_audit_event(
    campus_value, 'resource.reviewer_assigned', 'resource', submission_record.resource_id,
    jsonb_build_object('submission_id', target_submission_id, 'reviewer_id', target_reviewer_id)
  );
end;
$$;
revoke all on function public.assign_resource_reviewer(uuid,uuid) from public, anon;
grant execute on function public.assign_resource_reviewer(uuid,uuid) to authenticated;

create or replace function public.archive_review_submission(
  target_submission_id uuid,
  supplied_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  submission_record public.resource_submissions%rowtype;
  campus_value uuid;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  if coalesce(length(trim(supplied_reason)), 0) not between 3 and 1000 then
    raise exception using errcode = '22023', message = 'An archive reason is required';
  end if;

  select * into submission_record
  from public.resource_submissions
  where id = target_submission_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Submission not found';
  end if;
  if submission_record.status not in (
    'submitted'::public.submission_status,
    'under_review'::public.submission_status,
    'approved'::public.submission_status
  ) then
    raise exception using errcode = '23514', message = 'Submission is not active';
  end if;

  select campus_id into campus_value
  from public.resources
  where id = submission_record.resource_id;

  perform public.archive_resource(submission_record.resource_id);
  update public.resource_submissions
  set status = 'withdrawn'::public.submission_status,
      decided_at = now()
  where id = target_submission_id;

  insert into public.notifications(
    user_id, notification_type, title, message, entity_type, entity_id
  ) values (
    submission_record.submitter_id,
    'resource_archived',
    'Submission archived',
    'Your submission was archived by the review team. Contact campus content operations if you need more information.',
    'resource',
    submission_record.resource_id
  );
  insert into public.audit_events(
    campus_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    campus_value, auth.uid(), 'submission.archived', 'submission',
    target_submission_id,
    jsonb_build_object(
      'resource_id', submission_record.resource_id,
      'reason', trim(supplied_reason)
    )
  );
end;
$$;
revoke all on function public.archive_review_submission(uuid,text) from public, anon;
grant execute on function public.archive_review_submission(uuid,text) to authenticated;

create or replace function public.permanently_delete_resource(
  target_resource_id uuid,
  actor_user_id uuid,
  supplied_storage_objects jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resource_record public.resources%rowtype;
  job_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if jsonb_typeof(supplied_storage_objects) <> 'array'
     or not exists (
       select 1 from public.user_roles
       join public.profiles on profiles.id = user_roles.user_id
       where user_roles.user_id = actor_user_id
         and user_roles.role = 'super_admin'::public.app_role
         and profiles.account_status = 'active'::public.account_status
     ) then
    raise exception using errcode = '42501', message = 'An active super administrator is required';
  end if;
  select * into resource_record from public.resources where id = target_resource_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Resource was not found'; end if;
  if resource_record.status <> 'archived'::public.resource_status
     or resource_record.archived_at is null
     or resource_record.archived_at > now() - interval '90 days' then
    raise exception using errcode = '23514', message = 'Archived resource retention period has not elapsed';
  end if;
  insert into public.resource_deletion_jobs(resource_id, actor_id, storage_objects)
  values (target_resource_id, actor_user_id, supplied_storage_objects)
  returning id into job_id;
  insert into public.audit_events(campus_id, actor_id, action, entity_type, entity_id, metadata)
  values (resource_record.campus_id, actor_user_id, 'resource.permanently_deleted', 'resource', target_resource_id, jsonb_build_object('retention_days', 90, 'cleanup_job_id', job_id));
  delete from public.resources where id = target_resource_id;
  return job_id;
end;
$$;
revoke all on function public.permanently_delete_resource(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.permanently_delete_resource(uuid,uuid,jsonb) to service_role;

create table public.content_removal_requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references public.resources(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  relationship text not null,
  reason text not null,
  details text not null,
  evidence_url text,
  status public.report_status not null default 'open',
  ip_hash text not null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint removal_name_length check (length(trim(requester_name)) between 2 and 120),
  constraint removal_email_length check (length(trim(requester_email)) between 5 and 254),
  constraint removal_relationship_length check (length(trim(relationship)) between 3 and 120),
  constraint removal_reason_length check (length(trim(reason)) between 3 and 200),
  constraint removal_details_length check (length(trim(details)) between 20 and 5000),
  constraint removal_ip_hash_format check (ip_hash ~ '^[a-f0-9]{64}$')
);
create index removal_requests_queue_idx on public.content_removal_requests(status, created_at);
create index removal_requests_rate_idx on public.content_removal_requests(ip_hash, created_at desc);
create trigger content_removal_requests_set_updated_at before update on public.content_removal_requests
for each row execute function public.set_updated_at();
alter table public.content_removal_requests enable row level security;
alter table public.content_removal_requests force row level security;
create policy removal_requests_admin_read on public.content_removal_requests
for select to authenticated using (public.is_platform_admin());
revoke all on table public.content_removal_requests from anon, authenticated;
grant select on table public.content_removal_requests to authenticated;

create or replace function public.create_content_removal_request(
  target_resource_id uuid,
  supplied_name text,
  supplied_email text,
  supplied_relationship text,
  supplied_reason text,
  supplied_details text,
  supplied_evidence_url text,
  supplied_ip_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare request_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if lower(trim(supplied_email)) !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
     or supplied_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'Removal request identity is invalid';
  end if;
  if exists (
    select 1 from public.content_removal_requests
    where ip_hash = supplied_ip_hash and created_at > now() - interval '15 minutes'
  ) then
    raise exception using errcode = '42900', message = 'Please wait before submitting another request';
  end if;
  insert into public.content_removal_requests(
    resource_id, requester_name, requester_email, relationship, reason,
    details, evidence_url, ip_hash
  ) values (
    target_resource_id, trim(supplied_name), lower(trim(supplied_email)),
    trim(supplied_relationship), trim(supplied_reason), trim(supplied_details),
    nullif(trim(supplied_evidence_url), ''), supplied_ip_hash
  ) returning id into request_id;
  insert into public.audit_events(action, entity_type, entity_id, metadata)
  values ('content.removal_requested', 'removal_request', request_id, jsonb_build_object('resource_id', target_resource_id));
  return request_id;
end;
$$;
revoke all on function public.create_content_removal_request(uuid,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_content_removal_request(uuid,text,text,text,text,text,text,text) to service_role;

create or replace function public.resolve_content_removal_request(
  target_request_id uuid,
  resolution public.report_status,
  supplied_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;
  if resolution not in ('resolved'::public.report_status, 'dismissed'::public.report_status)
     or length(trim(supplied_note)) not between 3 and 2000 then
    raise exception using errcode = '22023', message = 'Resolution is invalid';
  end if;
  update public.content_removal_requests
  set status = resolution, resolution_note = trim(supplied_note),
      resolved_by = auth.uid(), resolved_at = now()
  where id = target_request_id and status in ('open'::public.report_status, 'investigating'::public.report_status);
  if not found then raise exception using errcode = 'P0002', message = 'Open removal request was not found'; end if;
  insert into public.audit_events(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'content.removal_resolved', 'removal_request', target_request_id, jsonb_build_object('resolution', resolution));
end;
$$;
revoke all on function public.resolve_content_removal_request(uuid,public.report_status,text) from public, anon;
grant execute on function public.resolve_content_removal_request(uuid,public.report_status,text) to authenticated;

commit;
