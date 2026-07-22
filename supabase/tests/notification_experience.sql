begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select has_column('public', 'notifications', 'campaign_id', 'history links to a campaign');
select has_column('public', 'notifications', 'target_url', 'history stores a safe internal route');
select has_column('public', 'notifications', 'resource_id', 'history can link to a resource');
select has_column('public', 'notification_preferences', 'foreground_popup_enabled', 'popup preference exists');
select has_column('public', 'notification_preferences', 'notification_sound_enabled', 'sound preference exists');

select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.notifications'::regclass),
  'notification history forces RLS'
);
select ok(
  (select coalesce(qual, '') ilike '%auth.uid()%'
   from pg_policies
   where schemaname = 'public' and tablename = 'notifications'
     and policyname = 'notifications_own_read'),
  'users can read only their own history'
);
select ok(
  (select coalesce(qual, '') ilike '%auth.uid()%'
      and coalesce(with_check, '') ilike '%auth.uid()%'
   from pg_policies
   where schemaname = 'public' and tablename = 'notifications'
     and policyname = 'notifications_own_mark_read'),
  'users can update only their own history rows'
);
select ok(not has_table_privilege('anon', 'public.notifications', 'SELECT'), 'anonymous history reads are denied');
select ok(not has_table_privilege('anon', 'public.notifications', 'UPDATE'), 'anonymous history updates are denied');
select ok(not has_table_privilege('authenticated', 'public.notifications', 'INSERT'), 'browser users cannot insert history');
select ok(not has_table_privilege('authenticated', 'public.notifications', 'DELETE'), 'browser users cannot delete history');
select ok(has_column_privilege('authenticated', 'public.notifications', 'read_at', 'UPDATE'), 'users can mark read_at');
select ok(not has_column_privilege('authenticated', 'public.notifications', 'title', 'UPDATE'), 'users cannot change notification title');
select ok(not has_column_privilege('authenticated', 'public.notifications', 'target_url', 'UPDATE'), 'users cannot change notification target');
select ok(exists(select 1 from pg_constraint where conname = 'notifications_campaign_user_unique'), 'campaign history is unique per user');
select ok(exists(select 1 from pg_constraint where conname = 'notification_deliveries_campaign_subscription_unique'), 'delivery is unique per subscription');
select ok(
  pg_get_functiondef('public.mark_all_notifications_read()'::regprocedure)
    ilike '%where user_id = actor and read_at is null%',
  'mark-all-read remains user-scoped and idempotent'
);

select * from finish();
rollback;
