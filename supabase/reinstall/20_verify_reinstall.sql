-- Read-only post-reinstall verification. The final transaction is rolled back
-- so pgTAP and verification work cannot change production data.

begin;

do $$
declare
  required_table text;
  missing_tables text[] := '{}';
begin
  foreach required_table in array array[
    'audit_events',
    'campuses',
    'content_removal_requests',
    'curriculum_versions',
    'faculties',
    'feedback_messages',
    'newsletter_subscriptions',
    'notifications',
    'profiles',
    'programs',
    'resource_categories',
    'resource_deletion_jobs',
    'resource_download_events',
    'resource_reports',
    'resource_reviews',
    'resource_submissions',
    'resource_upload_sessions',
    'resource_versions',
    'resources',
    'review_comments',
    'storage_settings',
    'subjects',
    'terms',
    'user_roles'
  ]
  loop
    if to_regclass('public.' || required_table) is null then
      missing_tables := array_append(missing_tables, required_table);
    end if;
  end loop;

  if cardinality(missing_tables) > 0 then
    raise exception 'Missing application tables: %', array_to_string(missing_tables, ', ');
  end if;

  if exists (select 1 from public.resources) then
    raise exception 'Resources must be empty after the clean reinstall';
  end if;
  if exists (select 1 from public.resource_versions) then
    raise exception 'Resource versions must be empty after the clean reinstall';
  end if;
  if exists (select 1 from public.resource_submissions) then
    raise exception 'Submissions must be empty after the clean reinstall';
  end if;

  if (
    select count(*)
    from public.programs
    join public.campuses on campuses.id = programs.campus_id
    where campuses.slug = 'jana-bhawana-campus'
      and programs.slug in ('bca', 'bicte', 'bbs', 'mbs')
      and programs.is_active
  ) <> 4 then
    raise exception 'The four required academic programs were not seeded';
  end if;

  if (
    select count(*)
    from public.terms
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bca'
      and terms.term_number between 1 and 8
      and terms.is_active
  ) <> 8 then
    raise exception 'The BCA eight-semester structure was not seeded';
  end if;

  if not exists (
    select 1
    from public.subjects
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bca'
      and subjects.code = 'BCA 451'
      and subjects.is_active
  ) then
    raise exception 'The required BCA subject catalog was not seeded';
  end if;

  if (
    select count(*) from storage.buckets
    where id in ('resource-quarantine', 'resource-published')
  ) <> 2 then
    raise exception 'Private Storage buckets were not configured';
  end if;

  raise notice 'JBC Athenaeum reinstall verification passed: 24 tables, empty resource data, academic catalog, and private buckets are present.';
end
$$;

rollback;
