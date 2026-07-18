begin;

create extension if not exists pgtap with schema extensions;
select plan(58);

select has_table('public', 'resource_bookmarks', 'resource bookmarks exist');
select has_table('public', 'resource_ratings', 'user ratings are separate from moderation reviews');
select has_table('public', 'notification_preferences', 'notification preferences exist');
select has_table('public', 'user_devices', 'device registration foundation exists');

select has_column('public', 'resource_download_events', 'user_id', 'download events can identify an authenticated user');
select has_column('public', 'resource_download_events', 'version_id', 'download events can identify a resource version');
select has_column('public', 'resources', 'abstract', 'resources support an abstract');
select has_column('public', 'resources', 'visibility', 'resources support explicit visibility');
select has_column('public', 'resources', 'thumbnail_path', 'resources support a protected thumbnail reference');
select has_column('public', 'resources', 'seo_title', 'resources support an SEO title');
select has_column('public', 'resources', 'seo_description', 'resources support an SEO description');

select has_function('public', 'get_resource_rating_summary', array['uuid'], 'safe rating aggregate RPC exists');
select has_function('public', 'mark_all_notifications_read', array[]::text[], 'mark-all-read RPC exists');
select has_function('public', 'record_resource_download', array['uuid','uuid','uuid'], 'trusted download history RPC exists');
select has_function('public', 'list_my_download_history', array['integer','integer'], 'private download history RPC exists');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.resource_bookmarks'::regclass), 'bookmarks force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.resource_ratings'::regclass), 'ratings force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.notification_preferences'::regclass), 'preferences force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.user_devices'::regclass), 'devices force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.resource_download_events'::regclass), 'download history forces RLS');

select ok(exists(select 1 from pg_constraint where conname = 'resource_bookmarks_user_resource_unique'), 'duplicate bookmarks are prevented');
select ok(exists(select 1 from pg_constraint where conname = 'resource_ratings_user_resource_unique'), 'duplicate user ratings are prevented');
select ok(exists(select 1 from pg_constraint where conname = 'resource_ratings_range'), 'rating range is database validated');
select ok(exists(select 1 from pg_constraint where conname = 'resources_visibility_check'), 'resource visibility values are constrained');

select ok(not has_table_privilege('anon', 'public.resource_bookmarks', 'SELECT'), 'anonymous users cannot read bookmarks');
select ok(has_table_privilege('authenticated', 'public.resource_bookmarks', 'SELECT'), 'authenticated users can reach own-bookmark RLS');
select ok(has_table_privilege('authenticated', 'public.resource_bookmarks', 'INSERT'), 'authenticated users can create own bookmarks');
select ok(has_table_privilege('authenticated', 'public.resource_bookmarks', 'DELETE'), 'authenticated users can delete own bookmarks');

select ok(not has_table_privilege('anon', 'public.resource_ratings', 'SELECT'), 'anonymous users cannot enumerate rating authors');
select ok(has_table_privilege('authenticated', 'public.resource_ratings', 'SELECT'), 'authenticated users can read their own rating');
select ok(has_table_privilege('authenticated', 'public.resource_ratings', 'INSERT'), 'authenticated users can create their own rating');
select ok(has_table_privilege('authenticated', 'public.resource_ratings', 'UPDATE'), 'authenticated users can edit their own rating');
select ok(has_function_privilege('anon', 'public.get_resource_rating_summary(uuid)', 'EXECUTE'), 'anonymous users can read safe aggregates');

select ok(not has_function_privilege('anon', 'public.mark_all_notifications_read()', 'EXECUTE'), 'anonymous users cannot mark notifications');
select ok(has_function_privilege('authenticated', 'public.mark_all_notifications_read()', 'EXECUTE'), 'authenticated users can mark their notifications');
select ok(not has_table_privilege('authenticated', 'public.resource_download_events', 'INSERT'), 'browser clients cannot forge history');
select ok(has_function_privilege('service_role', 'public.record_resource_download(uuid,uuid,uuid)', 'EXECUTE'), 'service role records trusted download history');
select ok(not has_function_privilege('authenticated', 'public.record_resource_download(uuid,uuid,uuid)', 'EXECUTE'), 'browser clients cannot call the trusted history writer');

select ok(not has_column_privilege('anon', 'public.resources', 'thumbnail_path', 'SELECT'), 'thumbnail storage paths are not public');
select ok(has_column_privilege('authenticated', 'public.user_devices', 'id', 'SELECT'), 'users can reach own-device RLS');
select ok(has_column_privilege('authenticated', 'public.user_devices', 'device_key', 'INSERT'), 'users can register their own device');
select ok(has_table_privilege('authenticated', 'public.user_devices', 'DELETE'), 'users can remove their own device');
select ok(not has_table_privilege('anon', 'public.user_devices', 'SELECT'), 'anonymous users cannot enumerate devices');
select ok(not has_column_privilege('authenticated', 'public.user_devices', 'push_token', 'SELECT'), 'push tokens are not returned to browser clients');

select ok(has_table_privilege('authenticated', 'public.notification_preferences', 'SELECT'), 'users can read their preferences');
select ok(has_table_privilege('authenticated', 'public.notification_preferences', 'INSERT'), 'users can create default preferences');
select ok(has_table_privilege('authenticated', 'public.notification_preferences', 'UPDATE'), 'users can update their preferences');
select ok(not has_table_privilege('anon', 'public.notification_preferences', 'SELECT'), 'anonymous users cannot read preferences');
select ok(
  (select count(*) = 3 from pg_policies where schemaname = 'public' and tablename = 'resource_bookmarks'),
  'bookmark policies are limited to own read, insert, and delete'
);
select ok(
  (select coalesce(qual, '') ilike '%auth.uid()%'
   from pg_policies where schemaname = 'public' and tablename = 'resource_bookmarks'
     and policyname = 'resource_bookmarks_own_read'),
  'bookmark reads are restricted to the current user'
);
select ok(
  (select coalesce(with_check, '') ilike '%auth.uid()%'
      and coalesce(with_check, '') ilike '%published%'
   from pg_policies where schemaname = 'public' and tablename = 'resource_bookmarks'
     and policyname = 'resource_bookmarks_own_insert'),
  'bookmark inserts require the current user and a published resource'
);
select ok(
  (select coalesce(qual, '') ilike '%auth.uid()%'
   from pg_policies where schemaname = 'public' and tablename = 'resource_bookmarks'
     and policyname = 'resource_bookmarks_own_delete'),
  'bookmark deletes are restricted to the current user'
);
select ok(
  (select count(*) = 4 from pg_policies
   where schemaname = 'public' and tablename = 'resource_ratings'
     and policyname like 'resource_ratings_own_%'
     and (coalesce(qual, '') ilike '%auth.uid()%'
       or coalesce(with_check, '') ilike '%auth.uid()%')),
  'rating mutations and own reads are user-scoped'
);
select ok(
  (select coalesce(with_check, '') ilike '%published%'
   from pg_policies where schemaname = 'public' and tablename = 'resource_ratings'
     and policyname = 'resource_ratings_own_insert'),
  'ratings reject unpublished resources'
);
select ok(
  (select coalesce(qual, '') ilike '%auth.uid()%'
   from pg_policies where schemaname = 'public' and tablename = 'resource_download_events'
     and policyname = 'resource_download_events_own_read'),
  'download history reads are restricted to the current user'
);
select ok(
  (select count(*) = 4 from pg_policies
   where schemaname = 'public' and tablename = 'notification_preferences'
     and (coalesce(qual, '') ilike '%auth.uid()%'
       or coalesce(with_check, '') ilike '%auth.uid()%')),
  'all preference policies are user-scoped'
);
select ok(
  (select count(*) = 4 from pg_policies
   where schemaname = 'public' and tablename = 'user_devices'
     and (coalesce(qual, '') ilike '%auth.uid()%'
       or coalesce(with_check, '') ilike '%auth.uid()%')),
  'all device policies are user-scoped'
);
select ok(
  pg_get_functiondef('public.mark_all_notifications_read()'::regprocedure)
    ilike '%where user_id = actor and read_at is null%',
  'mark-all-read is idempotent and cannot update another user'
);

select * from finish();
rollback;
