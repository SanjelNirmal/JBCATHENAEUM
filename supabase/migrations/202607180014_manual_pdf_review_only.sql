-- Route uploaded PDFs to human moderation without content-based automatic
-- rejection. Technical upload boundaries (authenticated owner, .pdf name,
-- size, private quarantine, and exact transferred byte count) remain.

begin;

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
  if not found then
    raise exception using errcode = 'P0002', message = 'Upload session not found';
  end if;
  if session_record.user_id <> request_user_id then
    raise exception using errcode = '42501', message = 'Upload session ownership mismatch';
  end if;
  if session_record.status <> 'issued'::public.upload_session_status
     or session_record.expires_at <= now() then
    raise exception using errcode = '23514', message = 'Upload session is no longer valid';
  end if;
  if actual_byte_size <> session_record.expected_byte_size
     or checksum_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'Transferred file metadata is invalid';
  end if;

  update public.resource_versions
  set byte_size = actual_byte_size,
      page_count = case
        when detected_page_count is not null and detected_page_count > 0
          then detected_page_count
        else null
      end,
      sha256_checksum = checksum_sha256,
      scan_status = 'pending'::public.resource_scan_status,
      scan_result = coalesce(validation_result, '{}'::jsonb)
        || jsonb_build_object(
          'automated_content_decision', false,
          'manual_review_required', true
        )
  where id = session_record.version_id
    and resource_id = session_record.resource_id;

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
    'Your PDF was received and entered the manual administrator review queue.',
    'resource', session_record.resource_id
  );

  insert into public.audit_events (
    campus_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    campus_id_value, request_user_id, 'resource.upload_received', 'resource',
    session_record.resource_id,
    jsonb_build_object(
      'session_id', target_session_id,
      'submission_id', submission_id_value,
      'version_id', session_record.version_id,
      'sha256', checksum_sha256,
      'manual_review_required', true
    )
  );

  return submission_id_value;
end;
$$;

revoke all on function public.complete_resource_upload(uuid,uuid,bigint,text,integer,jsonb)
  from public, anon, authenticated;
grant execute on function public.complete_resource_upload(uuid,uuid,bigint,text,integer,jsonb)
  to service_role;

create or replace function public.mark_manually_approved_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.decision = 'approved'::public.review_decision
     and new.published_version_id is not null then
    update public.resource_versions
    set scan_status = 'clean'::public.resource_scan_status,
        scan_result = coalesce(scan_result, '{}'::jsonb)
          || jsonb_build_object(
            'manual_review_required', false,
            'manually_approved', true,
            'manually_approved_by', new.reviewer_id,
            'manually_approved_at', now()
          )
    where id = new.published_version_id
      and resource_id = new.resource_id
      and scan_status = 'pending'::public.resource_scan_status;
  end if;
  return new;
end;
$$;

revoke all on function public.mark_manually_approved_version()
  from public, anon, authenticated;

drop trigger if exists resource_reviews_mark_manual_approval
  on public.resource_reviews;
create trigger resource_reviews_mark_manual_approval
after insert on public.resource_reviews
for each row execute function public.mark_manually_approved_version();

comment on function public.complete_resource_upload(uuid,uuid,bigint,text,integer,jsonb) is
  'Records a completed private upload and sends it to manual review without a content-based automatic decision.';

commit;
