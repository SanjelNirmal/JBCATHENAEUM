-- Contributor reputation comes from ratings received on their published
-- resources. Ratings written by the contributor belong to the reviewed
-- resource and must not increase the reviewer's own profile statistics.

begin;

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
      join public.resources
        on resources.id = resource_ratings.resource_id
      where resources.owner_id = profiles.id
        and resources.status = 'published'::public.resource_status
        and resources.deleted_at is null
        and resource_ratings.moderation_status = 'visible'
    ),
    coalesce((
      select round(avg(resource_ratings.rating)::numeric, 2)
      from public.resource_ratings
      join public.resources
        on resources.id = resource_ratings.resource_id
      where resources.owner_id = profiles.id
        and resources.status = 'published'::public.resource_status
        and resources.deleted_at is null
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
      from public.resources as owned_resources
      where owned_resources.owner_id = profile.id
        and owned_resources.status = 'published'::public.resource_status
        and owned_resources.deleted_at is null
    ),
    (
      select count(*)
      from public.resource_ratings
      join public.resources as rated_resources
        on rated_resources.id = resource_ratings.resource_id
      where rated_resources.owner_id = profile.id
        and rated_resources.status = 'published'::public.resource_status
        and rated_resources.deleted_at is null
        and resource_ratings.moderation_status = 'visible'
    ),
    coalesce((
      select round(avg(resource_ratings.rating)::numeric, 2)
      from public.resource_ratings
      join public.resources as rated_resources
        on rated_resources.id = resource_ratings.resource_id
      where rated_resources.owner_id = profile.id
        and rated_resources.status = 'published'::public.resource_status
        and rated_resources.deleted_at is null
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

commit;
