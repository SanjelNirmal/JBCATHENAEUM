begin;

alter table public.resource_upload_sessions
  add column if not exists upload_policy_slug text,
  add column if not exists upload_policy_version text,
  add column if not exists upload_policy_accepted_at timestamptz;

alter table public.resource_submissions
  add column if not exists upload_policy_slug text,
  add column if not exists upload_policy_version text,
  add column if not exists upload_policy_accepted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_upload_sessions_policy_acceptance_check'
  ) then
    alter table public.resource_upload_sessions
      add constraint resource_upload_sessions_policy_acceptance_check check (
        (
          upload_policy_slug is null
          and upload_policy_version is null
          and upload_policy_accepted_at is null
        )
        or (
          upload_policy_slug = 'upload'
          and length(trim(upload_policy_version)) between 1 and 40
          and upload_policy_accepted_at is not null
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_submissions_policy_acceptance_check'
  ) then
    alter table public.resource_submissions
      add constraint resource_submissions_policy_acceptance_check check (
        (
          upload_policy_slug is null
          and upload_policy_version is null
          and upload_policy_accepted_at is null
        )
        or (
          upload_policy_slug = 'upload'
          and length(trim(upload_policy_version)) between 1 and 40
          and upload_policy_accepted_at is not null
        )
      );
  end if;
end
$$;

create or replace function public.copy_upload_policy_acceptance_to_submission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.upload_policy_slug is not null then
    return new;
  end if;

  select
    upload_policy_slug,
    upload_policy_version,
    upload_policy_accepted_at
  into
    new.upload_policy_slug,
    new.upload_policy_version,
    new.upload_policy_accepted_at
  from public.resource_upload_sessions
  where resource_id = new.resource_id
    and version_id = new.version_id
    and user_id = new.submitter_id
  order by created_at desc
  limit 1;

  return new;
end;
$$;

revoke all on function public.copy_upload_policy_acceptance_to_submission()
  from public, anon, authenticated;

drop trigger if exists resource_submissions_copy_policy_acceptance
  on public.resource_submissions;
create trigger resource_submissions_copy_policy_acceptance
before insert on public.resource_submissions
for each row execute function public.copy_upload_policy_acceptance_to_submission();

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
  accepted_policy_slug text,
  accepted_policy_version text,
  existing_resource_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  session_payload jsonb;
  session_id_value uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  if accepted_policy_slug <> 'upload'
     or accepted_policy_version is null
     or length(trim(accepted_policy_version)) not between 1 and 40 then
    raise exception using errcode = '22023', message = 'Upload policy acceptance is required';
  end if;

  session_payload := public.create_resource_upload_session(
    request_user_id := request_user_id,
    target_campus_id := target_campus_id,
    target_program_id := target_program_id,
    target_curriculum_version_id := target_curriculum_version_id,
    target_term_id := target_term_id,
    target_subject_id := target_subject_id,
    target_category_id := target_category_id,
    resource_title := resource_title,
    resource_description := resource_description,
    resource_academic_year := resource_academic_year,
    original_file_name := original_file_name,
    declared_mime_type := declared_mime_type,
    expected_bytes := expected_bytes,
    existing_resource_id := existing_resource_id
  );

  session_id_value := (session_payload->>'session_id')::uuid;

  update public.resource_upload_sessions
  set upload_policy_slug = 'upload',
      upload_policy_version = trim(accepted_policy_version),
      upload_policy_accepted_at = now()
  where id = session_id_value
    and user_id = request_user_id;

  return session_payload;
end;
$$;

revoke all on function public.create_resource_upload_session(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, integer, text, text,
  bigint, text, text, uuid
) from public, anon, authenticated;

grant execute on function public.create_resource_upload_session(
  uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, integer, text, text,
  bigint, text, text, uuid
) to service_role;

grant select (
  upload_policy_slug, upload_policy_version, upload_policy_accepted_at
) on public.resource_upload_sessions to authenticated;

comment on column public.resource_upload_sessions.upload_policy_slug is
  'Policy slug accepted by the uploader when requesting the signed upload session.';
comment on column public.resource_upload_sessions.upload_policy_version is
  'Policy version accepted by the uploader when requesting the signed upload session.';
comment on column public.resource_upload_sessions.upload_policy_accepted_at is
  'Server timestamp for the upload policy acceptance declaration.';
comment on column public.resource_submissions.upload_policy_slug is
  'Policy slug copied from the upload session when a submission is created.';
comment on column public.resource_submissions.upload_policy_version is
  'Policy version copied from the upload session when a submission is created.';
comment on column public.resource_submissions.upload_policy_accepted_at is
  'Server timestamp copied from the upload session when a submission is created.';

commit;
