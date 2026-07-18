-- JBC Athenaeum account engagement and mobile-readiness foundation.
-- Additive only: existing roles, resource states, storage buckets, and download
-- aggregates remain unchanged.

begin;

-- Optional resource metadata. Existing rows remain publicly visible exactly as
-- before; future non-public values are enforced by RLS and trusted read paths.
alter table public.resources
  add column if not exists abstract text,
  add column if not exists visibility text not null default 'public',
  add column if not exists thumbnail_path text,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.resources drop constraint if exists resources_abstract_length;
alter table public.resources add constraint resources_abstract_length
  check (abstract is null or length(trim(abstract)) between 1 and 5000);
alter table public.resources drop constraint if exists resources_visibility_check;
alter table public.resources add constraint resources_visibility_check
  check (visibility in ('public', 'authenticated', 'restricted', 'private'));
alter table public.resources drop constraint if exists resources_thumbnail_path_length;
alter table public.resources add constraint resources_thumbnail_path_length
  check (thumbnail_path is null or length(trim(thumbnail_path)) between 1 and 1000);
alter table public.resources drop constraint if exists resources_seo_title_length;
alter table public.resources add constraint resources_seo_title_length
  check (seo_title is null or length(trim(seo_title)) between 3 and 70);
alter table public.resources drop constraint if exists resources_seo_description_length;
alter table public.resources add constraint resources_seo_description_length
  check (seo_description is null or length(trim(seo_description)) between 10 and 180);

create table if not exists public.resource_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint resource_bookmarks_user_resource_unique unique (user_id, resource_id)
);
create index if not exists resource_bookmarks_user_created_idx
  on public.resource_bookmarks(user_id, created_at desc);

create table if not exists public.resource_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  rating smallint not null,
  review_text text,
  moderation_status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_ratings_user_resource_unique unique (user_id, resource_id),
  constraint resource_ratings_range check (rating between 1 and 5),
  constraint resource_ratings_review_length
    check (review_text is null or length(trim(review_text)) between 1 and 2000),
  constraint resource_ratings_moderation_status_check
    check (moderation_status in ('visible', 'pending', 'hidden'))
);
create index if not exists resource_ratings_resource_visible_idx
  on public.resource_ratings(resource_id, created_at desc)
  where moderation_status = 'visible';
create index if not exists resource_ratings_user_created_idx
  on public.resource_ratings(user_id, created_at desc);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  push_enabled boolean not null default false,
  submission_updates boolean not null default true,
  resource_updates boolean not null default true,
  moderation_updates boolean not null default true,
  system_announcements boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key text not null,
  platform text not null,
  push_token text,
  device_name text,
  app_version text,
  notifications_enabled boolean not null default true,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_devices_user_key_unique unique (user_id, device_key),
  constraint user_devices_platform_check check (platform in ('web', 'android', 'ios')),
  constraint user_devices_key_length check (length(trim(device_key)) between 8 and 120),
  constraint user_devices_push_token_length check (push_token is null or length(push_token) <= 4096),
  constraint user_devices_name_length check (device_name is null or length(trim(device_name)) between 1 and 160),
  constraint user_devices_app_version_length check (app_version is null or length(trim(app_version)) between 1 and 80)
);
create index if not exists user_devices_user_active_idx
  on public.user_devices(user_id, last_active_at desc);
create unique index if not exists user_devices_push_token_unique
  on public.user_devices(push_token) where push_token is not null;

alter table public.resource_download_events
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists version_id uuid references public.resource_versions(id) on delete set null;
create index if not exists resource_download_events_user_time_idx
  on public.resource_download_events(user_id, downloaded_at desc)
  where user_id is not null;

drop trigger if exists resource_ratings_set_updated_at on public.resource_ratings;
create trigger resource_ratings_set_updated_at
before update on public.resource_ratings
for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists user_devices_set_updated_at on public.user_devices;
create trigger user_devices_set_updated_at
before update on public.user_devices
for each row execute function public.set_updated_at();

create or replace function public.normalize_resource_rating_review()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.review_text := nullif(trim(new.review_text), '');
  return new;
end;
$$;
revoke all on function public.normalize_resource_rating_review() from public;

drop trigger if exists resource_ratings_normalize_review on public.resource_ratings;
create trigger resource_ratings_normalize_review
before insert or update of review_text on public.resource_ratings
for each row execute function public.normalize_resource_rating_review();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'resource_bookmarks', 'resource_ratings',
    'notification_preferences', 'user_devices'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end
$$;

alter table public.resource_download_events enable row level security;
alter table public.resource_download_events force row level security;

create policy resource_bookmarks_own_read on public.resource_bookmarks
for select to authenticated using (user_id = auth.uid());
create policy resource_bookmarks_own_insert on public.resource_bookmarks
for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.resources
    where resources.id = resource_bookmarks.resource_id
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
      and resources.visibility in ('public', 'authenticated')
  )
);
create policy resource_bookmarks_own_delete on public.resource_bookmarks
for delete to authenticated using (user_id = auth.uid());

create policy resource_ratings_own_read on public.resource_ratings
for select to authenticated using (user_id = auth.uid());
create policy resource_ratings_admin_read on public.resource_ratings
for select to authenticated using (public.is_platform_admin());
create policy resource_ratings_own_insert on public.resource_ratings
for insert to authenticated with check (
  user_id = auth.uid()
  and moderation_status = 'visible'
  and exists (
    select 1 from public.resources
    where resources.id = resource_ratings.resource_id
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
      and resources.visibility in ('public', 'authenticated')
  )
);
create policy resource_ratings_own_update on public.resource_ratings
for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.resources
    where resources.id = resource_ratings.resource_id
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
      and resources.visibility in ('public', 'authenticated')
  )
);
create policy resource_ratings_own_delete on public.resource_ratings
for delete to authenticated using (user_id = auth.uid());

create policy notification_preferences_own_read on public.notification_preferences
for select to authenticated using (user_id = auth.uid());
create policy notification_preferences_own_insert on public.notification_preferences
for insert to authenticated with check (user_id = auth.uid());
create policy notification_preferences_own_update on public.notification_preferences
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_preferences_own_delete on public.notification_preferences
for delete to authenticated using (user_id = auth.uid());

create policy user_devices_own_read on public.user_devices
for select to authenticated using (user_id = auth.uid());
create policy user_devices_own_insert on public.user_devices
for insert to authenticated with check (user_id = auth.uid());
create policy user_devices_own_update on public.user_devices
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy user_devices_own_delete on public.user_devices
for delete to authenticated using (user_id = auth.uid());

create policy resource_download_events_own_read on public.resource_download_events
for select to authenticated using (user_id = auth.uid());

revoke all on table public.resource_bookmarks from public, anon, authenticated;
grant select, insert, delete on table public.resource_bookmarks to authenticated;

revoke all on table public.resource_ratings from public, anon, authenticated;
grant select on table public.resource_ratings to authenticated;
grant insert (user_id, resource_id, rating, review_text) on table public.resource_ratings to authenticated;
grant update (rating, review_text) on table public.resource_ratings to authenticated;
grant delete on table public.resource_ratings to authenticated;

revoke all on table public.notification_preferences from public, anon, authenticated;
grant select, insert, update, delete on table public.notification_preferences to authenticated;

revoke all on table public.user_devices from public, anon, authenticated;
grant select (id, user_id, device_key, platform, device_name, app_version,
  notifications_enabled, last_active_at, created_at, updated_at)
  on table public.user_devices to authenticated;
grant insert (user_id, device_key, platform, push_token, device_name,
  app_version, notifications_enabled, last_active_at)
  on table public.user_devices to authenticated;
grant update (platform, push_token, device_name, app_version,
  notifications_enabled, last_active_at)
  on table public.user_devices to authenticated;
grant delete on table public.user_devices to authenticated;

revoke all on table public.resource_download_events from public, anon, authenticated;
grant select (id, resource_id, user_id, version_id, downloaded_at)
  on table public.resource_download_events to authenticated;

-- Extend the existing resource read policies to enforce visibility without
-- changing the behavior of existing rows (all are backfilled as public).
drop policy if exists resources_public_read on public.resources;
create policy resources_public_read on public.resources
for select to anon, authenticated
using (
  status = 'published'::public.resource_status
  and visibility = 'public'
  and deleted_at is null
  and exists (select 1 from public.campuses where campuses.id = resources.campus_id and campuses.is_active)
  and exists (select 1 from public.programs where programs.id = resources.program_id and programs.is_active)
  and exists (select 1 from public.curriculum_versions where curriculum_versions.id = resources.curriculum_version_id and curriculum_versions.is_active)
  and exists (select 1 from public.terms where terms.id = resources.term_id and terms.is_active)
  and exists (select 1 from public.subjects where subjects.id = resources.subject_id and subjects.is_active)
  and exists (select 1 from public.resource_categories where resource_categories.id = resources.category_id and resource_categories.is_active)
);
create policy resources_authenticated_published_read on public.resources
for select to authenticated
using (
  status = 'published'::public.resource_status
  and visibility = 'authenticated'
  and deleted_at is null
);

drop policy if exists resource_versions_public_read on public.resource_versions;
create policy resource_versions_public_read on public.resource_versions
for select to anon, authenticated
using (
  exists (
    select 1 from public.resources
    where resources.id = resource_versions.resource_id
      and resources.status = 'published'::public.resource_status
      and resources.visibility = 'public'
      and resources.deleted_at is null
  )
);
create policy resource_versions_authenticated_published_read on public.resource_versions
for select to authenticated
using (
  exists (
    select 1 from public.resources
    where resources.id = resource_versions.resource_id
      and resources.status = 'published'::public.resource_status
      and resources.visibility = 'authenticated'
      and resources.deleted_at is null
  )
);

grant select (abstract, visibility, seo_title, seo_description)
  on table public.resources to anon, authenticated;
-- thumbnail_path intentionally remains unavailable to browser table reads.

create or replace function public.get_resource_rating_summary(target_resource_id uuid)
returns table (average_rating numeric, rating_count bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    coalesce(round(avg(resource_ratings.rating)::numeric, 2), 0::numeric),
    count(resource_ratings.id)
  from public.resources
  left join public.resource_ratings
    on resource_ratings.resource_id = resources.id
   and resource_ratings.moderation_status = 'visible'
  where resources.id = target_resource_id
    and resources.status = 'published'::public.resource_status
    and resources.deleted_at is null
    and (
      resources.visibility = 'public'
      or (auth.uid() is not null and resources.visibility = 'authenticated')
    );
$$;
revoke all on function public.get_resource_rating_summary(uuid) from public;
grant execute on function public.get_resource_rating_summary(uuid) to anon, authenticated;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  updated_count integer;
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  update public.notifications
  set read_at = now()
  where user_id = actor and read_at is null;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;
revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_all_notifications_read() to authenticated;

create or replace function public.record_resource_download(
  target_resource_id uuid,
  event_user_id uuid default null,
  target_version_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare valid_version_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;
  if target_version_id is not null then
    select id into valid_version_id
    from public.resource_versions
    where id = target_version_id and resource_id = target_resource_id;
  end if;
  update public.resources set download_count = download_count + 1
  where id = target_resource_id
    and status = 'published'::public.resource_status
    and deleted_at is null;
  if found then
    insert into public.resource_download_events(resource_id, user_id, version_id)
    values (target_resource_id, event_user_id, valid_version_id);
  end if;
end;
$$;
revoke all on function public.record_resource_download(uuid,uuid,uuid)
  from public, anon, authenticated;
grant execute on function public.record_resource_download(uuid,uuid,uuid) to service_role;

create or replace function public.increment_resource_download(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_resource_download(target_resource_id, null, null);
end;
$$;
revoke all on function public.increment_resource_download(uuid) from public, anon, authenticated;
grant execute on function public.increment_resource_download(uuid) to service_role;

create or replace function public.list_my_download_history(
  page_number integer default 1,
  page_size integer default 20
)
returns table (
  event_id bigint,
  resource_id uuid,
  resource_title text,
  resource_slug text,
  version_number integer,
  downloaded_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare actor uuid := auth.uid();
begin
  if actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required';
  end if;
  return query
  select
    events.id,
    resources.id,
    resources.title,
    resources.slug,
    versions.version_number,
    events.downloaded_at,
    count(*) over()
  from public.resource_download_events as events
  join public.resources on resources.id = events.resource_id
  left join public.resource_versions as versions on versions.id = events.version_id
  where events.user_id = actor
  order by events.downloaded_at desc
  limit least(greatest(page_size, 1), 50)
  offset (greatest(page_number, 1) - 1) * least(greatest(page_size, 1), 50);
end;
$$;
revoke all on function public.list_my_download_history(integer,integer) from public, anon;
grant execute on function public.list_my_download_history(integer,integer) to authenticated;

-- Recreate the public catalog boundary with an explicit visibility check.
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
  id uuid, title text, slug text, description text, academic_year integer,
  resource_type text, program_id uuid, program_name text, faculty_id uuid,
  faculty_name text, term_id uuid, term_name text, subject_id uuid,
  subject_name text, category_id uuid, category_name text,
  contributor_name text, legacy_url text, byte_size bigint,
  page_count integer, download_count bigint, created_at timestamptz,
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
    and resources.visibility = 'public'
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

comment on column public.resources.thumbnail_path is
  'Private storage reference; never granted through direct browser table reads.';
comment on table public.user_devices is
  'Device-registration foundation only; it does not imply an active push provider.';
comment on function public.record_resource_download(uuid,uuid,uuid) is
  'Service-only boundary. event_user_id must be derived from a validated JWT by the Edge Function.';

commit;
