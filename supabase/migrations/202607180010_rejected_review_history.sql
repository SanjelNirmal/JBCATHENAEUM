-- Preserve rejected review history for administrators without weakening the
-- quarantine boundary around files rejected by automated validation.

begin;

create or replace function public.list_review_queue(
  search_query text,
  status_filter public.submission_status,
  page_number integer,
  page_size integer
)
returns table (
  submission_id uuid,
  resource_id uuid,
  version_id uuid,
  submitter_id uuid,
  contributor text,
  status public.submission_status,
  submitted_at timestamptz,
  title text,
  program text,
  faculty text,
  term text,
  subject text,
  category text,
  byte_size bigint,
  page_count integer,
  mime_type text,
  scan_status text,
  duplicate_warning boolean,
  review_notes text[],
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null
     or not (
       public.has_role('moderator'::public.app_role)
       or public.is_platform_admin()
     ) then
    raise exception using
      errcode = '42501',
      message = 'Moderator or administrator role with MFA is required';
  end if;

  if page_number < 1 or page_size < 1 or page_size > 50 then
    raise exception using errcode = '22023', message = 'Invalid pagination';
  end if;

  if status_filter is not null
     and status_filter not in (
       'submitted'::public.submission_status,
       'under_review'::public.submission_status,
       'changes_requested'::public.submission_status,
       'approved'::public.submission_status,
       'rejected'::public.submission_status
     ) then
    raise exception using errcode = '22023', message = 'Invalid review queue status';
  end if;

  return query
  select
    submission.id as submission_id,
    submission.resource_id,
    submission.version_id,
    submission.submitter_id,
    coalesce(nullif(trim(profile.name), ''), 'Contributor') as contributor,
    submission.status,
    submission.submitted_at,
    resource.title,
    program_record.name as program,
    faculty_record.name as faculty,
    term_record.name as term,
    subject_record.name as subject,
    category_record.name as category,
    version.byte_size,
    version.page_count,
    version.mime_type,
    version.scan_status::text,
    false as duplicate_warning,
    coalesce(
      array(
        select comment_record.body
        from public.review_comments as comment_record
        where comment_record.submission_id = submission.id
        order by comment_record.created_at desc
        limit 3
      ),
      array[]::text[]
    ) || case
      when upload_session.failure_code is not null then
        array['Automated check: ' || replace(upload_session.failure_code, '_', ' ')]
      else array[]::text[]
    end as review_notes,
    count(*) over() as total_count
  from public.resource_submissions as submission
  join public.resources as resource on resource.id = submission.resource_id
  join public.resource_versions as version on version.id = submission.version_id
  join public.programs as program_record on program_record.id = resource.program_id
  join public.faculties as faculty_record on faculty_record.id = program_record.faculty_id
  join public.terms as term_record on term_record.id = resource.term_id
  join public.subjects as subject_record on subject_record.id = resource.subject_id
  join public.resource_categories as category_record on category_record.id = resource.category_id
  left join public.profiles as profile on profile.id = submission.submitter_id
  left join public.resource_upload_sessions as upload_session
    on upload_session.version_id = submission.version_id
  where (
    nullif(trim(search_query), '') is null
    or resource.title ilike '%' || trim(search_query) || '%'
  )
    and (
      (status_filter is null and submission.status in (
        'submitted'::public.submission_status,
        'under_review'::public.submission_status,
        'changes_requested'::public.submission_status,
        'approved'::public.submission_status,
        'rejected'::public.submission_status
      ))
      or submission.status = status_filter
    )
  order by
    case submission.status
      when 'submitted'::public.submission_status then 0
      when 'under_review'::public.submission_status then 1
      else 2
    end,
    case
      when submission.status in (
        'submitted'::public.submission_status,
        'under_review'::public.submission_status
      ) then submission.submitted_at
    end asc,
    submission.submitted_at desc,
    submission.id asc
  offset ((page_number - 1) * page_size)
  limit page_size;
end;
$$;

revoke all on function public.list_review_queue(text,public.submission_status,integer,integer)
  from public, anon;
grant execute on function public.list_review_queue(text,public.submission_status,integer,integer)
  to authenticated;

comment on function public.list_review_queue(text,public.submission_status,integer,integer) is
  'MFA-protected active moderation queue and read-only decision history, including automated rejection reasons.';

create or replace function public.list_resource_review_history(target_resource_id uuid)
returns table (
  id uuid,
  version_number integer,
  mime_type text,
  byte_size bigint,
  page_count integer,
  scan_status text,
  scan_result jsonb,
  failure_code text,
  is_current boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using
      errcode = '42501',
      message = 'Administrator role with MFA is required';
  end if;

  return query
  select
    version.id,
    version.version_number,
    version.mime_type,
    version.byte_size,
    version.page_count,
    version.scan_status::text,
    version.scan_result,
    upload_session.failure_code,
    version.is_current,
    version.created_at
  from public.resource_versions as version
  left join public.resource_upload_sessions as upload_session
    on upload_session.version_id = version.id
  where version.resource_id = target_resource_id
  order by version.version_number desc;
end;
$$;

revoke all on function public.list_resource_review_history(uuid)
  from public, anon;
grant execute on function public.list_resource_review_history(uuid)
  to authenticated;

comment on function public.list_resource_review_history(uuid) is
  'MFA-protected administrator history containing automated scan outcomes without private storage identifiers.';

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
  previous_submission_id uuid;
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

  if target_status = 'failed'::public.upload_session_status
     and not exists (
       select 1 from public.resource_submissions
       where version_id = session_record.version_id
     ) then
    select id into previous_submission_id
    from public.resource_submissions
    where resource_id = session_record.resource_id
    order by created_at desc
    limit 1;

    insert into public.resource_submissions (
      resource_id, version_id, submitter_id, status, decided_at, resubmission_of
    ) values (
      session_record.resource_id,
      session_record.version_id,
      request_user_id,
      'rejected'::public.submission_status,
      now(),
      previous_submission_id
    );

    insert into public.notifications (
      user_id, notification_type, title, message, entity_type, entity_id
    ) values (
      request_user_id,
      'resource_validation',
      'Automated PDF check rejected the upload',
      'An administrator can review the validation record. Correct the file and submit a new version.',
      'resource',
      session_record.resource_id
    );
  end if;

  insert into public.audit_events (
    campus_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    campus_id_value, request_user_id, 'resource.upload_' || target_status::text,
    'resource', session_record.resource_id,
    jsonb_build_object(
      'session_id', target_session_id,
      'version_id', session_record.version_id,
      'failure_code', left(coalesce(supplied_failure_code, 'unknown'), 120),
      'admin_review_available', target_status = 'failed'::public.upload_session_status
    )
  );
end;
$$;

revoke all on function public.fail_resource_upload(uuid, uuid, public.upload_session_status, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.fail_resource_upload(uuid, uuid, public.upload_session_status, text, jsonb)
  to service_role;

commit;
