-- Correct the review queue projection's enum-to-text return type without
-- rewriting the already-applied migration history.

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
       'approved'::public.submission_status
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
    ) as review_notes,
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
  where (
    nullif(trim(search_query), '') is null
    or resource.title ilike '%' || trim(search_query) || '%'
  )
    and (
      (status_filter is null and submission.status in (
        'submitted'::public.submission_status,
        'under_review'::public.submission_status,
        'approved'::public.submission_status
      ))
      or submission.status = status_filter
    )
  order by submission.submitted_at asc, submission.id asc
  offset ((page_number - 1) * page_size)
  limit page_size;
end;
$$;

revoke all on function public.list_review_queue(text,public.submission_status,integer,integer)
  from public, anon;
grant execute on function public.list_review_queue(text,public.submission_status,integer,integer)
  to authenticated;

comment on function public.list_review_queue(text,public.submission_status,integer,integer) is
  'MFA-protected moderation queue projection with pagination and no private storage identifiers.';

commit;
