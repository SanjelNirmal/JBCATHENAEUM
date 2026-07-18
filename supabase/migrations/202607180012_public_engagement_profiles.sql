-- JBC Athenaeum public contributor and engagement surface.
-- Adds safe RPCs for bookmark/rating writes and public profile/rating reads.

begin;

create or replace function public.search_public_resources(
  search_query text default null,
  faculty_filter uuid default null,
  program_filter uuid default null,
  term_filter uuid default null,
  subject_filter uuid default null,
  category_filter uuid default null,
  contributor_filter uuid default null,
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
  contributor_id uuid,
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
    resources.owner_id,
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
    and (contributor_filter is null or resources.owner_id = contributor_filter)
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

revoke all on function public.search_public_resources(text,uuid,uuid,uuid,uuid,uuid,uuid,integer,timestamptz,timestamptz,text,integer,integer) from public;
grant execute on function public.search_public_resources(text,uuid,uuid,uuid,uuid,uuid,uuid,integer,timestamptz,timestamptz,text,integer,integer) to anon, authenticated;

create or replace function public.get_public_contributor_profile(target_user_id uuid)
returns table (
  id uuid,
  name text,
  faculty text,
  avatar_url text,
  bio text,
  created_at timestamptz,
  resource_count bigint,
  rating_count bigint,
  average_rating numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    profiles.id,
    profiles.name,
    coalesce(profiles.faculty, 'Unspecified'),
    profiles.avatar_url,
    profiles.bio,
    profiles.created_at,
    (
      select count(*)
      from public.resources
      where resources.owner_id = profiles.id
        and resources.status = 'published'::public.resource_status
        and resources.deleted_at is null
    ),
    (
      select count(*)
      from public.resource_ratings
      where resource_ratings.user_id = profiles.id
        and resource_ratings.moderation_status = 'visible'
    ),
    coalesce((
      select round(avg(resource_ratings.rating)::numeric, 2)
      from public.resource_ratings
      where resource_ratings.user_id = profiles.id
        and resource_ratings.moderation_status = 'visible'
    ), 0::numeric)
  from public.profiles
  where profiles.id = target_user_id
    and profiles.account_status = 'active'::public.account_status;
$$;

revoke all on function public.get_public_contributor_profile(uuid) from public;
grant execute on function public.get_public_contributor_profile(uuid) to anon, authenticated;

create or replace function public.get_public_resource_contributor(target_resource_id uuid)
returns table (
  id uuid,
  name text,
  faculty text,
  avatar_url text,
  bio text,
  created_at timestamptz,
  resource_count bigint,
  rating_count bigint,
  average_rating numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    profile.id,
    profile.name,
    coalesce(profile.faculty, 'Unspecified'),
    profile.avatar_url,
    profile.bio,
    profile.created_at,
    (
      select count(*)
      from public.resources
      where resources.owner_id = profile.id
        and resources.status = 'published'::public.resource_status
        and resources.deleted_at is null
    ),
    (
      select count(*)
      from public.resource_ratings
      where resource_ratings.user_id = profile.id
        and resource_ratings.moderation_status = 'visible'
    ),
    coalesce((
      select round(avg(resource_ratings.rating)::numeric, 2)
      from public.resource_ratings
      where resource_ratings.user_id = profile.id
        and resource_ratings.moderation_status = 'visible'
    ), 0::numeric)
  from public.resources
  join public.profiles as profile on profile.id = resources.owner_id
  where resources.id = target_resource_id
    and resources.status = 'published'::public.resource_status
    and resources.deleted_at is null
    and profile.account_status = 'active'::public.account_status;
$$;

revoke all on function public.get_public_resource_contributor(uuid) from public;
grant execute on function public.get_public_resource_contributor(uuid) to anon, authenticated;

create or replace function public.list_public_resource_ratings(
  target_resource_id uuid,
  page_number integer default 1,
  page_size integer default 5
)
returns table (
  id uuid,
  rating smallint,
  review_text text,
  created_at timestamptz,
  reviewer_id uuid,
  reviewer_name text,
  reviewer_faculty text,
  reviewer_avatar_url text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with visible_ratings as (
    select
      resource_ratings.id,
      resource_ratings.rating,
      resource_ratings.review_text,
      resource_ratings.created_at,
      profiles.id as reviewer_id,
      profiles.name as reviewer_name,
      coalesce(profiles.faculty, 'Unspecified') as reviewer_faculty,
      profiles.avatar_url as reviewer_avatar_url,
      count(*) over() as total_count
    from public.resource_ratings
    join public.profiles on profiles.id = resource_ratings.user_id
    join public.resources on resources.id = resource_ratings.resource_id
    where resource_ratings.resource_id = target_resource_id
      and resource_ratings.moderation_status = 'visible'
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
      and profiles.account_status = 'active'::public.account_status
    order by resource_ratings.created_at desc
    limit least(greatest(page_size, 1), 20)
    offset (greatest(page_number, 1) - 1) * least(greatest(page_size, 1), 20)
  )
  select * from visible_ratings;
$$;

revoke all on function public.list_public_resource_ratings(uuid,integer,integer) from public;
grant execute on function public.list_public_resource_ratings(uuid,integer,integer) to anon, authenticated;

create or replace function public.toggle_resource_bookmark(
  target_resource_id uuid,
  next_bookmarked boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if not exists (
    select 1
    from public.profiles
    where profiles.id = actor
      and profiles.account_status = 'active'::public.account_status
  ) then
    raise exception using errcode = '42501', message = 'An active account is required';
  end if;
  if not exists (
    select 1
    from public.resources
    where resources.id = target_resource_id
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
      and resources.visibility in ('public', 'authenticated')
  ) then
    raise exception using errcode = 'P0002', message = 'The resource is not available for saving';
  end if;

  if next_bookmarked then
    insert into public.resource_bookmarks (user_id, resource_id)
    values (actor, target_resource_id)
    on conflict (user_id, resource_id) do nothing;
    return true;
  end if;

  delete from public.resource_bookmarks
  where user_id = actor and resource_id = target_resource_id;
  return false;
end;
$$;

revoke all on function public.toggle_resource_bookmark(uuid,boolean) from public, anon;
grant execute on function public.toggle_resource_bookmark(uuid,boolean) to authenticated;

create or replace function public.save_resource_rating(
  target_resource_id uuid,
  next_rating smallint,
  next_review_text text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  if not exists (
    select 1
    from public.profiles
    where profiles.id = actor
      and profiles.account_status = 'active'::public.account_status
  ) then
    raise exception using errcode = '42501', message = 'An active account is required';
  end if;
  if next_rating is null or next_rating < 1 or next_rating > 5 then
    raise exception using errcode = '22023', message = 'Rating must be between 1 and 5';
  end if;
  if not exists (
    select 1
    from public.resources
    where resources.id = target_resource_id
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
      and resources.visibility in ('public', 'authenticated')
  ) then
    raise exception using errcode = 'P0002', message = 'The resource is not available for rating';
  end if;

  insert into public.resource_ratings (
    user_id, resource_id, rating, review_text, moderation_status
  ) values (
    actor, target_resource_id, next_rating, nullif(trim(next_review_text), ''), 'visible'
  )
  on conflict (user_id, resource_id) do update
    set rating = excluded.rating,
        review_text = excluded.review_text,
        moderation_status = 'visible',
        updated_at = now();
end;
$$;

revoke all on function public.save_resource_rating(uuid,smallint,text) from public, anon;
grant execute on function public.save_resource_rating(uuid,smallint,text) to authenticated;

create or replace function public.delete_resource_rating(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  delete from public.resource_ratings
  where user_id = actor
    and resource_id = target_resource_id;
end;
$$;

revoke all on function public.delete_resource_rating(uuid) from public, anon;
grant execute on function public.delete_resource_rating(uuid) to authenticated;

commit;
