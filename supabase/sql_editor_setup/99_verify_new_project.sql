-- Read-only new-project verification. Run after setup files 01 through 17.
-- The final transaction is rolled back
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
    'notification_preferences',
    'notifications',
    'profiles',
    'programs',
    'resource_categories',
    'resource_deletion_jobs',
    'resource_download_events',
    'resource_bookmarks',
    'resource_ratings',
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
    'user_devices',
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
    raise exception 'Resources must be empty in a new project';
  end if;
  if exists (select 1 from public.resource_versions) then
    raise exception 'Resource versions must be empty in a new project';
  end if;
  if exists (select 1 from public.resource_submissions) then
    raise exception 'Submissions must be empty in a new project';
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
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bca'
      and terms.term_number between 1 and 8
      and terms.is_active
  ) <> 8 then
    raise exception 'The BCA eight-semester structure was not seeded';
  end if;

  if (
    select count(*)
    from public.curriculum_versions
    join public.programs on programs.id = curriculum_versions.program_id
    where programs.slug = 'bca'
      and curriculum_versions.slug in ('old-bca-syllabus', 'catalog-current')
      and curriculum_versions.name in (
        'Old BCA syllabus (currently studied)',
        'New BCA syllabus (2025)'
      )
      and curriculum_versions.is_active
  ) < 2 then
    raise exception 'Both old and new BCA syllabus catalogs must be active';
  end if;

  if (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bca'
      and curriculum_versions.slug = 'old-bca-syllabus'
      and terms.term_number between 1 and 8
      and terms.is_active
  ) <> 8 then
    raise exception 'The old BCA syllabus must contain all eight semesters';
  end if;

  if not exists (
    select 1
    from public.subjects
    join public.curriculum_versions
      on curriculum_versions.id = subjects.curriculum_version_id
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bca'
      and curriculum_versions.slug = 'old-bca-syllabus'
      and subjects.code = 'CACS251'
      and subjects.name = 'Operating Systems'
      and subjects.is_active
  ) then
    raise exception 'The old BCA subject catalog was not seeded';
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

  if to_regprocedure('public.get_public_contributor_profile(uuid)') is null
     or to_regprocedure('public.get_public_resource_contributor(uuid)') is null
     or to_regprocedure('public.list_public_resource_ratings(uuid,integer,integer)') is null
     or to_regprocedure('public.toggle_resource_bookmark(uuid,boolean)') is null
     or to_regprocedure('public.save_resource_rating(uuid,smallint,text)') is null then
    raise exception 'Public profile, bookmark, or rating functions are missing';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'resource_upload_sessions'
      and column_name = 'upload_policy_version'
  ) then
    raise exception 'Upload Policy acceptance columns are missing. Run 13_upload_policy_acceptance.sql successfully before running 99_verify_new_project.sql.';
  end if;

  if position(
    'resources.owner_id = profiles.id' in
    pg_get_functiondef('public.get_public_contributor_profile(uuid)'::regprocedure)
  ) = 0 then
    raise exception 'Contributor received-rating calculation is not installed';
  end if;

  if to_regprocedure('public.mark_manually_approved_version()') is null
     or not exists (
       select 1
       from pg_trigger
       where tgname = 'resource_reviews_mark_manual_approval'
         and not tgisinternal
     ) then
    raise exception 'Manual-only PDF review workflow is not installed';
  end if;

  if to_regprocedure('public.permanently_delete_resource(uuid,uuid,jsonb)') is null
     or position(
       'immediate_deletion' in
       pg_get_functiondef('public.permanently_delete_resource(uuid,uuid,jsonb)'::regprocedure)
     ) = 0 then
    raise exception 'Immediate Super Admin resource deletion is not installed';
  end if;

  raise notice 'JBC Athenaeum new-project verification passed: 28 tables, empty resource data, old and new BCA curricula, engagement functions, Upload Policy acceptance, manual PDF review, Super Admin deletion, and private buckets are present.';
end
$$;

rollback;
