-- JBC ATHENAEUM Phase 2: submission/review workflow, notifications,
-- reports, feedback, and expanded append-only audit records.

begin;

do $$
begin
  create type public.submission_status as enum (
    'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'withdrawn'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.review_decision as enum ('approved', 'changes_requested', 'rejected');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.report_status as enum ('open', 'investigating', 'resolved', 'dismissed');
exception when duplicate_object then null;
end
$$;

alter table public.audit_events
  add column campus_id uuid references public.campuses(id) on delete set null;
alter table public.audit_events add column ip_hash text;
alter table public.audit_events add column user_agent_summary text;
alter table public.audit_events add constraint audit_events_ip_hash_format
  check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$');
alter table public.audit_events add constraint audit_events_user_agent_length
  check (user_agent_summary is null or length(user_agent_summary) <= 300);

create index audit_events_campus_created_idx
  on public.audit_events(campus_id, created_at desc);
create index audit_events_action_created_idx
  on public.audit_events(action, created_at desc);

create or replace function public.infer_audit_event_campus()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.campus_id is null
     and new.entity_type = 'resource'
     and new.entity_id is not null then
    select campus_id into new.campus_id
    from public.resources where id = new.entity_id;
  end if;
  return new;
end;
$$;

revoke all on function public.infer_audit_event_campus() from public;
create trigger audit_events_infer_campus
before insert on public.audit_events
for each row execute function public.infer_audit_event_campus();

create or replace function public.write_audit_event(
  event_campus_id uuid,
  event_action text,
  event_entity_type text,
  event_entity_id uuid,
  event_metadata jsonb default '{}'::jsonb,
  event_ip_hash text default null,
  event_user_agent_summary text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare event_id bigint;
begin
  if length(trim(event_action)) not between 3 and 120
     or length(trim(event_entity_type)) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'Audit event identifiers are invalid';
  end if;

  insert into public.audit_events (
    campus_id, actor_id, action, entity_type, entity_id, metadata,
    ip_hash, user_agent_summary
  ) values (
    event_campus_id, auth.uid(), trim(event_action), trim(event_entity_type),
    event_entity_id, coalesce(event_metadata, '{}'::jsonb), event_ip_hash,
    left(event_user_agent_summary, 300)
  ) returning id into event_id;

  return event_id;
end;
$$;

revoke all on function public.write_audit_event(uuid, text, text, uuid, jsonb, text, text) from public, anon, authenticated;

create table public.resource_submissions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  version_id uuid not null references public.resource_versions(id) on delete restrict,
  submitter_id uuid not null references auth.users(id) on delete restrict,
  status public.submission_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewer_id uuid references auth.users(id) on delete set null,
  review_started_at timestamptz,
  decided_at timestamptz,
  resubmission_of uuid references public.resource_submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_submissions_decision_time check (
    decided_at is null or decided_at >= submitted_at
  )
);

create index resource_submissions_submitter_idx
  on public.resource_submissions(submitter_id, created_at desc);
create index resource_submissions_review_queue_idx
  on public.resource_submissions(status, submitted_at);
create index resource_submissions_resource_idx
  on public.resource_submissions(resource_id, created_at desc);

create table public.resource_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.resource_submissions(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  decision public.review_decision not null,
  comment text,
  rejection_reason text,
  requested_changes text,
  published_version_id uuid references public.resource_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint resource_reviews_rejection_reason check (
    decision <> 'rejected'::public.review_decision
    or coalesce(length(trim(rejection_reason)), 0) between 3 and 2000
  ),
  constraint resource_reviews_requested_changes check (
    decision <> 'changes_requested'::public.review_decision
    or coalesce(length(trim(requested_changes)), 0) between 3 and 4000
  )
);

create index resource_reviews_submission_idx on public.resource_reviews(submission_id, created_at desc);
create index resource_reviews_reviewer_idx on public.resource_reviews(reviewer_id, created_at desc);

create table public.review_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.resource_submissions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_comments_body_length check (length(trim(body)) between 1 and 4000)
);

create index review_comments_submission_idx
  on public.review_comments(submission_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_length check (length(trim(notification_type)) between 2 and 80),
  constraint notifications_title_length check (length(trim(title)) between 2 and 200),
  constraint notifications_message_length check (length(trim(message)) between 2 and 2000)
);

create index notifications_user_unread_idx
  on public.notifications(user_id, created_at desc)
  where read_at is null;

create table public.resource_reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_reports_reason_length check (length(trim(reason)) between 3 and 120),
  constraint resource_reports_details_length check (details is null or length(trim(details)) <= 4000)
);

create unique index resource_reports_one_open_per_user
  on public.resource_reports(resource_id, reporter_id)
  where status in ('open'::public.report_status, 'investigating'::public.report_status);
create index resource_reports_queue_idx on public.resource_reports(status, created_at);

create table public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint feedback_name_length check (length(trim(sender_name)) between 2 and 120),
  constraint feedback_subject_length check (length(trim(subject)) between 3 and 200),
  constraint feedback_message_length check (length(trim(message)) between 10 and 5000),
  constraint feedback_status_check check (status in ('new', 'in_progress', 'resolved', 'spam'))
);

create index feedback_messages_status_idx on public.feedback_messages(status, created_at);
create index feedback_messages_email_created_idx on public.feedback_messages(lower(sender_email), created_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'resource_submissions', 'review_comments', 'resource_reports'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end
$$;

create or replace function public.prevent_self_review()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare submission_submitter uuid;
begin
  select submitter_id into submission_submitter
  from public.resource_submissions
  where id = new.submission_id;

  if submission_submitter = new.reviewer_id then
    raise exception using errcode = '42501', message = 'A submitter cannot review their own submission';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_self_review() from public;

create trigger resource_reviews_prevent_self_review
before insert or update of reviewer_id, submission_id on public.resource_reviews
for each row execute function public.prevent_self_review();

do $$
declare
  policy_record record;
  table_name text;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'resource_submissions', 'resource_reviews', 'review_comments',
        'notifications', 'resource_reports', 'feedback_messages'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;

  foreach table_name in array array[
    'resource_submissions', 'resource_reviews', 'review_comments',
    'notifications', 'resource_reports', 'feedback_messages'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end
$$;

create policy submissions_participant_read on public.resource_submissions
for select to authenticated
using (
  submitter_id = auth.uid()
  or reviewer_id = auth.uid()
  or public.has_role('moderator'::public.app_role)
  or public.is_platform_admin()
);

create policy reviews_participant_read on public.resource_reviews
for select to authenticated
using (
  reviewer_id = auth.uid()
  or public.has_role('moderator'::public.app_role)
  or public.is_platform_admin()
  or exists (
    select 1 from public.resource_submissions
    where resource_submissions.id = resource_reviews.submission_id
      and resource_submissions.submitter_id = auth.uid()
  )
);

create policy review_comments_participant_read on public.review_comments
for select to authenticated
using (
  author_id = auth.uid()
  or public.has_role('moderator'::public.app_role)
  or public.is_platform_admin()
  or (
    not is_internal and exists (
      select 1 from public.resource_submissions
      where resource_submissions.id = review_comments.submission_id
        and resource_submissions.submitter_id = auth.uid()
    )
  )
);

create policy notifications_own_read on public.notifications
for select to authenticated using (user_id = auth.uid());
create policy notifications_own_mark_read on public.notifications
for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_reporter_or_admin_read on public.resource_reports
for select to authenticated
using (reporter_id = auth.uid() or public.is_platform_admin());

create policy feedback_admin_read on public.feedback_messages
for select to authenticated using (public.is_platform_admin());

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'resource_submissions', 'resource_reviews', 'review_comments',
    'resource_reports', 'feedback_messages'
  ]
  loop
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select on table public.%I to authenticated', table_name);
  end loop;
end
$$;

revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create or replace function public.submit_resource(
  target_resource_id uuid,
  target_version_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  resource_record public.resources%rowtype;
  submission_id_value uuid;
  previous_submission_id uuid;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if not (
    public.has_role('contributor'::public.app_role)
    or public.has_role('faculty'::public.app_role)
    or public.has_role('moderator'::public.app_role)
    or public.is_platform_admin()
  ) then
    raise exception using errcode = '42501', message = 'Contributor role is required';
  end if;

  select * into resource_record from public.resources
  where id = target_resource_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Resource not found'; end if;
  if resource_record.owner_id is distinct from actor then
    raise exception using errcode = '42501', message = 'Only the resource owner may submit it';
  end if;
  if resource_record.status not in (
    'draft'::public.resource_status,
    'changes_requested'::public.resource_status,
    'rejected'::public.resource_status
  ) then
    raise exception using errcode = '23514', message = 'Resource is not in a submittable state';
  end if;
  if not exists (
    select 1 from public.resource_versions
    where id = target_version_id
      and resource_id = target_resource_id
      and scan_status not in ('infected'::public.resource_scan_status, 'rejected'::public.resource_scan_status)
  ) then
    raise exception using errcode = '23514', message = 'A valid resource version is required';
  end if;

  select id into previous_submission_id
  from public.resource_submissions
  where resource_id = target_resource_id
  order by created_at desc limit 1;

  insert into public.resource_submissions (
    resource_id, version_id, submitter_id, status, resubmission_of
  ) values (
    target_resource_id, target_version_id, actor,
    'submitted'::public.submission_status, previous_submission_id
  ) returning id into submission_id_value;

  update public.resources
  set status = 'submitted'::public.resource_status, reviewer_id = null, reviewed_at = null
  where id = target_resource_id;

  perform public.write_audit_event(
    resource_record.campus_id, 'resource.submitted', 'resource', target_resource_id,
    jsonb_build_object('submission_id', submission_id_value, 'version_id', target_version_id)
  );
  return submission_id_value;
end;
$$;

revoke all on function public.submit_resource(uuid, uuid) from public;
grant execute on function public.submit_resource(uuid, uuid) to authenticated;

create or replace function public.claim_resource_review(target_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  submission_record public.resource_submissions%rowtype;
  campus_id_value uuid;
begin
  if actor is null or not (
    public.has_role('moderator'::public.app_role) or public.is_platform_admin()
  ) then
    raise exception using errcode = '42501', message = 'Moderator role is required';
  end if;

  select * into submission_record from public.resource_submissions
  where id = target_submission_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Submission not found'; end if;
  if submission_record.submitter_id = actor then
    raise exception using errcode = '42501', message = 'A submitter cannot review their own submission';
  end if;
  if submission_record.status <> 'submitted'::public.submission_status then
    raise exception using errcode = '23514', message = 'Submission is not available for review';
  end if;

  update public.resource_submissions
  set status = 'under_review'::public.submission_status,
      reviewer_id = actor,
      review_started_at = now()
  where id = target_submission_id;
  update public.resources
  set status = 'under_review'::public.resource_status, reviewer_id = actor
  where id = submission_record.resource_id
  returning campus_id into campus_id_value;

  perform public.write_audit_event(
    campus_id_value, 'resource.review_claimed', 'resource', submission_record.resource_id,
    jsonb_build_object('submission_id', target_submission_id)
  );
end;
$$;

revoke all on function public.claim_resource_review(uuid) from public;
grant execute on function public.claim_resource_review(uuid) to authenticated;

create or replace function public.decide_resource_review(
  target_submission_id uuid,
  review_outcome public.review_decision,
  reviewer_comment text default null,
  supplied_rejection_reason text default null,
  supplied_requested_changes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  submission_record public.resource_submissions%rowtype;
  resource_record public.resources%rowtype;
  review_id_value uuid;
  next_resource_status public.resource_status;
  next_submission_status public.submission_status;
begin
  if actor is null or not (
    public.has_role('moderator'::public.app_role) or public.is_platform_admin()
  ) then
    raise exception using errcode = '42501', message = 'Moderator role is required';
  end if;

  select * into submission_record from public.resource_submissions
  where id = target_submission_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Submission not found'; end if;
  if submission_record.submitter_id = actor then
    raise exception using errcode = '42501', message = 'A submitter cannot review their own submission';
  end if;
  if submission_record.status <> 'under_review'::public.submission_status
     or submission_record.reviewer_id <> actor then
    raise exception using errcode = '42501', message = 'Reviewer must claim this submission first';
  end if;

  select * into resource_record from public.resources where id = submission_record.resource_id;

  if review_outcome = 'approved'::public.review_decision then
    next_resource_status := 'approved'::public.resource_status;
    next_submission_status := 'approved'::public.submission_status;
  elsif review_outcome = 'changes_requested'::public.review_decision then
    next_resource_status := 'changes_requested'::public.resource_status;
    next_submission_status := 'changes_requested'::public.submission_status;
  else
    next_resource_status := 'rejected'::public.resource_status;
    next_submission_status := 'rejected'::public.submission_status;
  end if;

  insert into public.resource_reviews (
    submission_id, resource_id, reviewer_id, decision, comment,
    rejection_reason, requested_changes, published_version_id
  ) values (
    target_submission_id, submission_record.resource_id, actor, review_outcome,
    nullif(trim(reviewer_comment), ''), nullif(trim(supplied_rejection_reason), ''),
    nullif(trim(supplied_requested_changes), ''),
    case when review_outcome = 'approved'::public.review_decision then submission_record.version_id else null end
  ) returning id into review_id_value;

  update public.resource_submissions
  set status = next_submission_status, decided_at = now()
  where id = target_submission_id;
  update public.resources
  set status = next_resource_status, reviewed_at = now(), reviewer_id = actor
  where id = submission_record.resource_id;

  insert into public.notifications (
    user_id, notification_type, title, message, entity_type, entity_id
  ) values (
    submission_record.submitter_id,
    'resource_review',
    'Resource review updated',
    case review_outcome
      when 'approved'::public.review_decision then 'Your resource was approved and is awaiting publication.'
      when 'changes_requested'::public.review_decision then 'Changes were requested for your resource.'
      else 'Your resource submission was rejected.'
    end,
    'resource', submission_record.resource_id
  );

  perform public.write_audit_event(
    resource_record.campus_id,
    case review_outcome
      when 'approved'::public.review_decision then 'resource.approved'
      when 'changes_requested'::public.review_decision then 'resource.changes_requested'
      else 'resource.rejected'
    end,
    'resource', submission_record.resource_id,
    jsonb_build_object('submission_id', target_submission_id, 'review_id', review_id_value)
  );
  return review_id_value;
end;
$$;

revoke all on function public.decide_resource_review(uuid, public.review_decision, text, text, text) from public;
grant execute on function public.decide_resource_review(uuid, public.review_decision, text, text, text) to authenticated;

create or replace function public.publish_resource(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  resource_record public.resources%rowtype;
  approved_version_id uuid;
begin
  if actor is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role is required';
  end if;

  select * into resource_record from public.resources
  where id = target_resource_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Resource not found'; end if;
  if resource_record.status <> 'approved'::public.resource_status then
    raise exception using errcode = '23514', message = 'Only an approved resource can be published';
  end if;

  select reviews.published_version_id into approved_version_id
  from public.resource_reviews as reviews
  where reviews.resource_id = target_resource_id
    and reviews.decision = 'approved'::public.review_decision
  order by reviews.created_at desc limit 1;
  if approved_version_id is null then
    raise exception using errcode = '23514', message = 'Approved resource version is missing';
  end if;

  update public.resource_versions set is_current = false where resource_id = target_resource_id;
  update public.resource_versions
  set is_current = true
  where id = approved_version_id
    and resource_id = target_resource_id
    and scan_status in (
      'clean'::public.resource_scan_status,
      'legacy_unverified'::public.resource_scan_status
    );
  if not found then
    raise exception using errcode = '23514', message = 'Approved version is missing or has not passed the publication scan gate';
  end if;

  update public.resources
  set status = 'published'::public.resource_status,
      current_version_id = approved_version_id,
      published_at = now(),
      archived_at = null,
      deleted_at = null
  where id = target_resource_id;

  if resource_record.owner_id is not null then
    insert into public.notifications (
      user_id, notification_type, title, message, entity_type, entity_id
    ) values (
      resource_record.owner_id, 'resource_published', 'Resource published',
      'Your approved resource is now available in the public archive.',
      'resource', target_resource_id
    );
  end if;

  perform public.write_audit_event(
    resource_record.campus_id, 'resource.published', 'resource', target_resource_id,
    jsonb_build_object('version_id', approved_version_id)
  );
end;
$$;

revoke all on function public.publish_resource(uuid) from public;
grant execute on function public.publish_resource(uuid) to authenticated;

create or replace function public.add_review_comment(
  target_submission_id uuid,
  comment_body text,
  internal_comment boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  submission_record public.resource_submissions%rowtype;
  comment_id_value uuid;
  is_review_team boolean;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if comment_body is null or length(trim(comment_body)) not between 1 and 4000 then
    raise exception using errcode = '22023', message = 'Comment content is invalid';
  end if;

  select * into submission_record
  from public.resource_submissions where id = target_submission_id;
  if not found then raise exception using errcode = 'P0002', message = 'Submission not found'; end if;

  is_review_team := coalesce(submission_record.reviewer_id = actor, false)
    or public.has_role('moderator'::public.app_role)
    or public.is_platform_admin();
  if submission_record.submitter_id <> actor and not is_review_team then
    raise exception using errcode = '42501', message = 'Submission participant access is required';
  end if;
  if internal_comment and not is_review_team then
    raise exception using errcode = '42501', message = 'Only reviewers may create internal comments';
  end if;

  insert into public.review_comments (submission_id, author_id, body, is_internal)
  values (target_submission_id, actor, trim(comment_body), internal_comment)
  returning id into comment_id_value;
  return comment_id_value;
end;
$$;

revoke all on function public.add_review_comment(uuid, text, boolean) from public;
grant execute on function public.add_review_comment(uuid, text, boolean) to authenticated;

create or replace function public.submit_resource_report(
  target_resource_id uuid,
  report_reason text,
  report_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  report_id_value uuid;
  campus_id_value uuid;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required to report a resource';
  end if;
  if report_reason is null
     or length(trim(report_reason)) not between 3 and 120
     or length(coalesce(trim(report_details), '')) > 4000 then
    raise exception using errcode = '22023', message = 'Report content is invalid';
  end if;
  select campus_id into campus_id_value from public.resources
  where id = target_resource_id
    and status = 'published'::public.resource_status
    and deleted_at is null;
  if not found then raise exception using errcode = 'P0002', message = 'Published resource not found'; end if;

  insert into public.resource_reports (resource_id, reporter_id, reason, details)
  values (target_resource_id, actor, trim(report_reason), nullif(trim(report_details), ''))
  returning id into report_id_value;

  perform public.write_audit_event(
    campus_id_value, 'resource.reported', 'resource', target_resource_id,
    jsonb_build_object('report_id', report_id_value)
  );
  return report_id_value;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'You already have an open report for this resource';
end;
$$;

revoke all on function public.submit_resource_report(uuid, text, text) from public;
grant execute on function public.submit_resource_report(uuid, text, text) to authenticated;

create or replace function public.resolve_resource_report(
  target_report_id uuid,
  resolution public.report_status,
  supplied_resolution_note text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  report_record public.resource_reports%rowtype;
  campus_id_value uuid;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role is required';
  end if;
  if resolution not in ('resolved'::public.report_status, 'dismissed'::public.report_status)
     or supplied_resolution_note is null
     or length(trim(supplied_resolution_note)) not between 3 and 2000 then
    raise exception using errcode = '22023', message = 'A final resolution and note are required';
  end if;

  select * into report_record from public.resource_reports
  where id = target_report_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Report not found'; end if;

  update public.resource_reports
  set status = resolution,
      resolved_by = auth.uid(),
      resolution_note = trim(supplied_resolution_note),
      resolved_at = now()
  where id = target_report_id;

  select campus_id into campus_id_value
  from public.resources where id = report_record.resource_id;
  perform public.write_audit_event(
    campus_id_value, 'resource_report.' || resolution::text,
    'resource_report', target_report_id,
    jsonb_build_object('resource_id', report_record.resource_id)
  );
end;
$$;

revoke all on function public.resolve_resource_report(uuid, public.report_status, text) from public;
grant execute on function public.resolve_resource_report(uuid, public.report_status, text) to authenticated;

create or replace function public.submit_feedback(
  supplied_name text,
  supplied_email text,
  supplied_subject text,
  supplied_message text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(trim(supplied_email));
  feedback_id_value uuid;
begin
  if supplied_name is null or supplied_email is null or supplied_subject is null
     or supplied_message is null
     or length(trim(supplied_name)) not between 2 and 120
     or normalized_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
     or length(trim(supplied_subject)) not between 3 and 200
     or length(trim(supplied_message)) not between 10 and 5000 then
    raise exception using errcode = '22023', message = 'Feedback content is invalid';
  end if;

  if exists (
    select 1 from public.feedback_messages
    where lower(sender_email) = normalized_email
      and created_at > now() - interval '15 minutes'
  ) then
    raise exception using errcode = 'P0001', message = 'Please wait before sending another feedback message';
  end if;

  insert into public.feedback_messages (sender_name, sender_email, subject, message)
  values (
    trim(supplied_name), normalized_email, trim(supplied_subject), trim(supplied_message)
  ) returning id into feedback_id_value;
  return feedback_id_value;
end;
$$;

revoke all on function public.submit_feedback(text, text, text, text) from public;
grant execute on function public.submit_feedback(text, text, text, text) to anon, authenticated;

comment on table public.resource_submissions is 'Immutable submission attempts for a resource version; state changes occur through trusted RPCs.';
comment on table public.resource_reviews is 'Review decisions protected by self-review trigger and trusted workflow RPCs.';
comment on table public.audit_events is 'Append-only security and operational audit stream; browser clients have read-only admin access.';

commit;
