-- JBC Athenaeum academic posts CMS.
-- Safe to rerun in the Supabase SQL editor after the Stage 1 role migration
-- and Phase 2 academic catalog migrations have been applied.

begin;

do $$
begin
  create type public.academic_post_status as enum (
    'draft', 'published', 'scheduled', 'archived'
  );
exception
  when duplicate_object then null;
end
$$;

create or replace function public.can_manage_academic_posts()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_role('faculty'::public.app_role)
      or public.has_role('moderator'::public.app_role)
      or public.has_role('admin'::public.app_role)
      or public.has_role('super_admin'::public.app_role);
$$;

revoke all on function public.can_manage_academic_posts() from public;
grant execute on function public.can_manage_academic_posts() to anon, authenticated;

create table if not exists public.academic_post_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_post_categories_name_nonempty
    check (length(trim(name)) between 2 and 100),
  constraint academic_post_categories_slug_nonempty
    check (slug = public.slugify(slug) and length(slug) between 2 and 100)
);

create unique index if not exists academic_post_categories_slug_lower_key
  on public.academic_post_categories(lower(slug));
create unique index if not exists academic_post_categories_name_lower_key
  on public.academic_post_categories(lower(name));
create index if not exists academic_post_categories_active_order_idx
  on public.academic_post_categories(is_active, sort_order, name);

create table if not exists public.academic_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  excerpt text not null,
  body text not null,
  program_id uuid references public.programs(id) on delete restrict,
  category_id uuid not null references public.academic_post_categories(id) on delete restrict,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  cover_image_path text,
  cover_image_url text,
  drive_url text,
  resource_count integer not null default 0,
  reading_time_minutes integer not null default 1,
  status public.academic_post_status not null default 'draft',
  is_featured boolean not null default false,
  featured_order integer,
  published_at timestamptz,
  scheduled_for timestamptz,
  archived_at timestamptz,
  view_count bigint not null default 0,
  drive_open_count bigint not null default 0,
  share_count bigint not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body, '')), 'C')
  ) stored,
  constraint academic_posts_title_nonempty
    check (length(trim(title)) between 2 and 240),
  constraint academic_posts_slug_nonempty
    check (slug = public.slugify(slug) and length(slug) between 2 and 180),
  constraint academic_posts_excerpt_nonempty
    check (length(trim(excerpt)) between 2 and 300),
  constraint academic_posts_body_nonempty
    check (length(trim(body)) >= 2),
  constraint academic_posts_author_name_length
    check (author_name is null or length(trim(author_name)) between 2 and 160),
  constraint academic_posts_resource_count_nonnegative check (resource_count >= 0),
  constraint academic_posts_reading_time_positive check (reading_time_minutes > 0),
  constraint academic_posts_view_count_nonnegative check (view_count >= 0),
  constraint academic_posts_drive_open_count_nonnegative check (drive_open_count >= 0),
  constraint academic_posts_share_count_nonnegative check (share_count >= 0),
  constraint academic_posts_published_at_required check (
    status <> 'published'::public.academic_post_status or published_at is not null
  ),
  constraint academic_posts_scheduled_for_required check (
    status <> 'scheduled'::public.academic_post_status or scheduled_for is not null
  ),
  constraint academic_posts_archive_timestamp check (
    status = 'archived'::public.academic_post_status or archived_at is null
  ),
  constraint academic_posts_drive_url_https_google check (
    drive_url is null
    or drive_url ~* '^https://(drive|docs)\.google\.com/'
  ),
  constraint academic_posts_cover_url_https check (
    cover_image_url is null or cover_image_url ~* '^https://'
  ),
  constraint academic_posts_featured_state check (
    not is_featured
    or status in (
      'published'::public.academic_post_status,
      'scheduled'::public.academic_post_status
    )
  )
);

create unique index if not exists academic_posts_slug_lower_key
  on public.academic_posts(lower(slug));
create unique index if not exists academic_posts_one_primary_featured
  on public.academic_posts((is_featured))
  where is_featured and deleted_at is null;
create index if not exists academic_posts_status_idx
  on public.academic_posts(status);
create index if not exists academic_posts_published_at_idx
  on public.academic_posts(published_at desc)
  where deleted_at is null;
create index if not exists academic_posts_scheduled_for_idx
  on public.academic_posts(scheduled_for)
  where status = 'scheduled'::public.academic_post_status and deleted_at is null;
create index if not exists academic_posts_category_idx
  on public.academic_posts(category_id, published_at desc);
create index if not exists academic_posts_program_idx
  on public.academic_posts(program_id, published_at desc);
create index if not exists academic_posts_author_idx
  on public.academic_posts(author_id, updated_at desc);
create index if not exists academic_posts_featured_idx
  on public.academic_posts(is_featured, featured_order, published_at desc)
  where deleted_at is null;
create index if not exists academic_posts_deleted_idx
  on public.academic_posts(deleted_at);
create index if not exists academic_posts_search_idx
  on public.academic_posts using gin(search_document);

create table if not exists public.academic_post_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.academic_posts(id) on delete cascade,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  session_key text,
  created_at timestamptz not null default now(),
  constraint academic_post_events_type_check
    check (event_type in ('view', 'drive_open', 'share')),
  constraint academic_post_events_session_key_length
    check (session_key is null or length(session_key) between 8 and 128)
);

create index if not exists academic_post_events_post_created_idx
  on public.academic_post_events(post_id, created_at desc);
create index if not exists academic_post_events_type_created_idx
  on public.academic_post_events(event_type, created_at desc);
create unique index if not exists academic_post_events_unique_session_event
  on public.academic_post_events(post_id, event_type, session_key)
  where session_key is not null;

drop trigger if exists academic_post_categories_set_updated_at
  on public.academic_post_categories;
create trigger academic_post_categories_set_updated_at
before update on public.academic_post_categories
for each row execute function public.set_updated_at();

drop trigger if exists academic_posts_set_updated_at on public.academic_posts;
create or replace function public.set_academic_post_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if (
    to_jsonb(new)
      - 'view_count'
      - 'drive_open_count'
      - 'share_count'
      - 'updated_at'
      - 'search_document'
  ) is distinct from (
    to_jsonb(old)
      - 'view_count'
      - 'drive_open_count'
      - 'share_count'
      - 'updated_at'
      - 'search_document'
  ) then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end;
$$;

create trigger academic_posts_set_updated_at
before update on public.academic_posts
for each row execute function public.set_academic_post_updated_at();

create or replace function public.guard_academic_post_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.deleted_at is distinct from new.deleted_at
     and not public.has_role('super_admin'::public.app_role) then
    raise exception using
      errcode = '42501',
      message = 'A super administrator is required to delete or restore a deleted post';
  end if;
  return new;
end;
$$;

drop trigger if exists academic_posts_guard_mutation on public.academic_posts;
create trigger academic_posts_guard_mutation
before update on public.academic_posts
for each row execute function public.guard_academic_post_mutation();

create or replace function public.audit_academic_post_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  action_name text;
begin
  if tg_op = 'INSERT' then
    action_name := 'academic_post_created';
  elsif (
    to_jsonb(new)
      - 'view_count'
      - 'drive_open_count'
      - 'share_count'
      - 'updated_at'
      - 'search_document'
  ) is not distinct from (
    to_jsonb(old)
      - 'view_count'
      - 'drive_open_count'
      - 'share_count'
      - 'updated_at'
      - 'search_document'
  ) then
    return new;
  elsif old.deleted_at is null and new.deleted_at is not null then
    action_name := 'academic_post_deleted';
  elsif old.status is distinct from new.status then
    action_name := case new.status
      when 'published'::public.academic_post_status then 'academic_post_published'
      when 'archived'::public.academic_post_status then 'academic_post_archived'
      when 'draft'::public.academic_post_status then
        case
          when old.status = 'archived'::public.academic_post_status
            then 'academic_post_restored'
          else 'academic_post_unpublished'
        end
      else 'academic_post_updated'
    end;
  elsif old.is_featured is distinct from new.is_featured then
    action_name := case when new.is_featured
      then 'academic_post_featured'
      else 'academic_post_unfeatured'
    end;
  else
    action_name := 'academic_post_updated';
  end if;

  insert into public.audit_events(
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    action_name,
    'academic_post',
    new.id,
    jsonb_build_object(
      'title', new.title,
      'status', new.status,
      'is_featured', new.is_featured
    )
  );
  return new;
end;
$$;

drop trigger if exists academic_posts_audit_mutation on public.academic_posts;
create trigger academic_posts_audit_mutation
after insert or update on public.academic_posts
for each row execute function public.audit_academic_post_mutation();

insert into public.academic_post_categories(
  name, slug, description, sort_order
)
values
  ('Notes', 'notes', 'Lecture notes and subject study material.', 10),
  ('Past Questions', 'past-questions', 'Past examinations and model questions.', 20),
  ('Projects', 'projects', 'Project guidance, reports, and showcase material.', 30),
  ('Notices', 'notices', 'Official campus and academic notices.', 40),
  ('Admission', 'admission', 'Admission dates, requirements, and guidance.', 50),
  ('Assignments', 'assignments', 'Assignments and coursework guidance.', 60),
  ('Results', 'results', 'Academic results and result-related notices.', 70),
  ('Syllabus', 'syllabus', 'Curriculum and syllabus documents.', 80),
  ('Books', 'books', 'Book lists and permitted learning references.', 90),
  ('Practical Files', 'practical-files', 'Laboratory and practical resources.', 100),
  ('Tutorials', 'tutorials', 'Academic tutorials and learning guides.', 110),
  ('Important Updates', 'important-updates', 'Time-sensitive academic updates.', 120),
  ('News', 'news', 'Campus and academic news.', 130),
  ('Events', 'events', 'Campus events and academic activities.', 140)
on conflict ((lower(slug))) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

alter table public.academic_post_categories enable row level security;
alter table public.academic_post_categories force row level security;
alter table public.academic_posts enable row level security;
alter table public.academic_posts force row level security;
alter table public.academic_post_events enable row level security;
alter table public.academic_post_events force row level security;

drop policy if exists academic_post_categories_public_read
  on public.academic_post_categories;
create policy academic_post_categories_public_read
on public.academic_post_categories
for select to anon, authenticated
using (is_active or public.can_manage_academic_posts());

drop policy if exists academic_post_categories_manager_insert
  on public.academic_post_categories;
create policy academic_post_categories_manager_insert
on public.academic_post_categories
for insert to authenticated
with check (public.can_manage_academic_posts());

drop policy if exists academic_post_categories_manager_update
  on public.academic_post_categories;
create policy academic_post_categories_manager_update
on public.academic_post_categories
for update to authenticated
using (public.can_manage_academic_posts())
with check (public.can_manage_academic_posts());

drop policy if exists academic_post_categories_manager_delete
  on public.academic_post_categories;
create policy academic_post_categories_manager_delete
on public.academic_post_categories
for delete to authenticated
using (public.has_role('super_admin'::public.app_role));

drop policy if exists academic_posts_public_read on public.academic_posts;
create policy academic_posts_public_read
on public.academic_posts
for select to anon, authenticated
using (
  (
    status = 'published'::public.academic_post_status
    and published_at <= now()
    and deleted_at is null
  )
  or public.can_manage_academic_posts()
);

drop policy if exists academic_posts_manager_insert on public.academic_posts;
create policy academic_posts_manager_insert
on public.academic_posts
for insert to authenticated
with check (
  public.can_manage_academic_posts()
  and (author_id is null or author_id = auth.uid() or public.is_platform_admin())
);

drop policy if exists academic_posts_manager_update on public.academic_posts;
create policy academic_posts_manager_update
on public.academic_posts
for update to authenticated
using (public.can_manage_academic_posts())
with check (public.can_manage_academic_posts());

drop policy if exists academic_posts_super_admin_delete on public.academic_posts;
create policy academic_posts_super_admin_delete
on public.academic_posts
for delete to authenticated
using (public.has_role('super_admin'::public.app_role));

drop policy if exists academic_post_events_manager_read
  on public.academic_post_events;
create policy academic_post_events_manager_read
on public.academic_post_events
for select to authenticated
using (public.can_manage_academic_posts());

revoke all on table public.academic_post_categories from anon, authenticated;
grant select on table public.academic_post_categories to anon, authenticated;
grant insert, update, delete on table public.academic_post_categories to authenticated;

revoke all on table public.academic_posts from anon, authenticated;
grant select on table public.academic_posts to anon, authenticated;
grant insert, update, delete on table public.academic_posts to authenticated;

revoke all on table public.academic_post_events from anon, authenticated;
grant select on table public.academic_post_events to authenticated;

create or replace function public.require_academic_post_manager()
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.can_manage_academic_posts() then
    raise exception using
      errcode = '42501',
      message = 'Academic post management permission is required';
  end if;
end;
$$;

revoke all on function public.require_academic_post_manager() from public;

create or replace function public.publish_due_academic_posts()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected integer;
begin
  update public.academic_posts
  set
    status = 'published'::public.academic_post_status,
    published_at = coalesce(scheduled_for, now()),
    scheduled_for = null,
    archived_at = null
  where status = 'scheduled'::public.academic_post_status
    and scheduled_for <= now()
    and deleted_at is null;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.publish_due_academic_posts() from public;
grant execute on function public.publish_due_academic_posts() to anon, authenticated;

create or replace function public.increment_academic_post_view(
  post_slug text,
  supplied_session_key text default null
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_post_id uuid;
  next_count bigint;
  inserted_count integer := 1;
  normalized_session_key text := nullif(trim(supplied_session_key), '');
begin
  if normalized_session_key is not null
     and normalized_session_key !~ '^[A-Za-z0-9._:-]{8,128}$' then
    normalized_session_key := null;
  end if;

  select id into target_post_id
  from public.academic_posts
  where lower(slug) = lower(trim(post_slug))
    and status = 'published'::public.academic_post_status
    and published_at <= now()
    and deleted_at is null;

  if target_post_id is null then
    raise exception using errcode = 'P0002', message = 'Published post not found';
  end if;

  if normalized_session_key is not null then
    insert into public.academic_post_events(
      post_id, event_type, user_id, session_key
    ) values (
      target_post_id, 'view', auth.uid(), normalized_session_key
    )
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  else
    insert into public.academic_post_events(post_id, event_type, user_id)
    values (target_post_id, 'view', auth.uid());
  end if;

  if inserted_count > 0 then
    update public.academic_posts
    set view_count = view_count + 1
    where id = target_post_id
    returning view_count into next_count;
  else
    select view_count into next_count
    from public.academic_posts
    where id = target_post_id;
  end if;
  return next_count;
end;
$$;

revoke all on function public.increment_academic_post_view(text, text) from public;
grant execute on function public.increment_academic_post_view(text, text)
  to anon, authenticated;

create or replace function public.record_academic_post_event(
  post_slug text,
  requested_event_type text,
  supplied_session_key text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_post_id uuid;
  normalized_session_key text := nullif(trim(supplied_session_key), '');
  inserted_count integer := 1;
begin
  if requested_event_type not in ('drive_open', 'share') then
    raise exception using errcode = '22023', message = 'Unsupported event type';
  end if;
  if normalized_session_key is not null
     and normalized_session_key !~ '^[A-Za-z0-9._:-]{8,128}$' then
    normalized_session_key := null;
  end if;

  select id into target_post_id
  from public.academic_posts
  where lower(slug) = lower(trim(post_slug))
    and status = 'published'::public.academic_post_status
    and published_at <= now()
    and deleted_at is null;
  if target_post_id is null then
    raise exception using errcode = 'P0002', message = 'Published post not found';
  end if;

  if normalized_session_key is not null then
    insert into public.academic_post_events(
      post_id, event_type, user_id, session_key
    ) values (
      target_post_id, requested_event_type, auth.uid(), normalized_session_key
    )
    on conflict do nothing;
    get diagnostics inserted_count = row_count;
  else
    insert into public.academic_post_events(post_id, event_type, user_id)
    values (target_post_id, requested_event_type, auth.uid());
  end if;

  if inserted_count = 0 then
    return;
  elsif requested_event_type = 'drive_open' then
    update public.academic_posts
    set drive_open_count = drive_open_count + 1
    where id = target_post_id;
  else
    update public.academic_posts
    set share_count = share_count + 1
    where id = target_post_id;
  end if;
end;
$$;

revoke all on function public.record_academic_post_event(text, text, text)
  from public;
grant execute on function public.record_academic_post_event(text, text, text)
  to anon, authenticated;

create or replace function public.publish_academic_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_academic_post_manager();
  update public.academic_posts
  set
    status = 'published'::public.academic_post_status,
    published_at = coalesce(published_at, now()),
    scheduled_for = null,
    archived_at = null
  where id = target_post_id and deleted_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Academic post not found';
  end if;
end;
$$;

create or replace function public.unpublish_academic_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_academic_post_manager();
  update public.academic_posts
  set
    status = 'draft'::public.academic_post_status,
    published_at = null,
    scheduled_for = null,
    archived_at = null,
    is_featured = false,
    featured_order = null
  where id = target_post_id and deleted_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Academic post not found';
  end if;
end;
$$;

create or replace function public.archive_academic_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_academic_post_manager();
  update public.academic_posts
  set
    status = 'archived'::public.academic_post_status,
    archived_at = now(),
    scheduled_for = null,
    is_featured = false,
    featured_order = null
  where id = target_post_id and deleted_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Academic post not found';
  end if;
end;
$$;

create or replace function public.restore_academic_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.require_academic_post_manager();
  update public.academic_posts
  set
    status = 'draft'::public.academic_post_status,
    archived_at = null,
    published_at = null,
    scheduled_for = null,
    is_featured = false,
    featured_order = null
  where id = target_post_id and deleted_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Academic post not found';
  end if;
end;
$$;

create or replace function public.set_featured_academic_post(
  target_post_id uuid,
  should_feature boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_status public.academic_post_status;
begin
  perform public.require_academic_post_manager();
  select status into target_status
  from public.academic_posts
  where id = target_post_id and deleted_at is null
  for update;
  if target_status is null then
    raise exception using errcode = 'P0002', message = 'Academic post not found';
  end if;
  if should_feature and target_status not in (
    'published'::public.academic_post_status,
    'scheduled'::public.academic_post_status
  ) then
    raise exception using errcode = '23514', message = 'Only published or scheduled posts may be featured';
  end if;
  if should_feature then
    update public.academic_posts
    set is_featured = false, featured_order = null
    where is_featured and id <> target_post_id;
  end if;
  update public.academic_posts
  set
    is_featured = should_feature,
    featured_order = case when should_feature then 1 else null end
  where id = target_post_id;
end;
$$;

create or replace function public.soft_delete_academic_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null
     or not public.has_role('super_admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'Super administrator role is required';
  end if;
  update public.academic_posts
  set
    deleted_at = now(),
    is_featured = false,
    featured_order = null
  where id = target_post_id and deleted_at is null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Academic post not found';
  end if;
end;
$$;

create or replace function public.restore_deleted_academic_post(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null
     or not public.has_role('super_admin'::public.app_role) then
    raise exception using errcode = '42501', message = 'Super administrator role is required';
  end if;
  update public.academic_posts
  set deleted_at = null
  where id = target_post_id and deleted_at is not null;
  if not found then
    raise exception using errcode = 'P0002', message = 'Deleted academic post not found';
  end if;
end;
$$;

do $$
declare
  signature text;
begin
  foreach signature in array array[
    'publish_academic_post(uuid)',
    'unpublish_academic_post(uuid)',
    'archive_academic_post(uuid)',
    'restore_academic_post(uuid)',
    'set_featured_academic_post(uuid, boolean)',
    'soft_delete_academic_post(uuid)',
    'restore_deleted_academic_post(uuid)'
  ]
  loop
    execute format('revoke all on function public.%s from public', signature);
    execute format('grant execute on function public.%s to authenticated', signature);
  end loop;
end
$$;

insert into storage.buckets(
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'academic-post-covers',
  'academic-post-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists academic_post_covers_public_read on storage.objects;
create policy academic_post_covers_public_read
on storage.objects
for select to anon, authenticated
using (
  bucket_id = 'academic-post-covers'
  and (
    public.can_manage_academic_posts()
    or exists (
      select 1
      from public.academic_posts
      where academic_posts.cover_image_path = storage.objects.name
        and academic_posts.status = 'published'::public.academic_post_status
        and academic_posts.published_at <= now()
        and academic_posts.deleted_at is null
    )
  )
);

drop policy if exists academic_post_covers_manager_insert on storage.objects;
create policy academic_post_covers_manager_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'academic-post-covers'
  and public.can_manage_academic_posts()
  and (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
);

drop policy if exists academic_post_covers_manager_update on storage.objects;
create policy academic_post_covers_manager_update
on storage.objects
for update to authenticated
using (
  bucket_id = 'academic-post-covers'
  and public.can_manage_academic_posts()
)
with check (
  bucket_id = 'academic-post-covers'
  and public.can_manage_academic_posts()
);

drop policy if exists academic_post_covers_manager_delete on storage.objects;
create policy academic_post_covers_manager_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'academic-post-covers'
  and public.can_manage_academic_posts()
);

-- Supabase projects with pg_cron enabled publish scheduled posts every minute.
-- Projects without pg_cron remain safe: public queries call the same idempotent
-- function before reading posts.
do $$
declare
  existing_job boolean := false;
begin
  if to_regclass('cron.job') is not null then
    execute
      'select exists (select 1 from cron.job where jobname = $1)'
      into existing_job
      using 'academic-posts-publish-minute';
    if not existing_job then
      execute $schedule$
        select cron.schedule(
          'academic-posts-publish-minute',
          '* * * * *',
          'select public.publish_due_academic_posts()'
        )
      $schedule$;
    end if;
  end if;
end
$$;

comment on table public.academic_posts is
  'CMS-managed academic resources, news, notices, and announcements.';
comment on function public.increment_academic_post_view(text, text) is
  'Atomic public view counter that never exposes unpublished posts.';
comment on function public.publish_due_academic_posts() is
  'Idempotently promotes due scheduled academic posts; safe for cron and public query preflight.';

commit;
