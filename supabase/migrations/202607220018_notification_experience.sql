-- Facebook-style foreground, push, and notification-center delivery model.
begin;

alter table public.notification_preferences
  add column if not exists foreground_popup_enabled boolean not null default true,
  add column if not exists notification_sound_enabled boolean not null default true;

alter table public.notifications
  add column if not exists campaign_id uuid references public.push_notification_campaigns(id) on delete cascade,
  add column if not exists category text,
  add column if not exists target_url text not null default '/notifications',
  add column if not exists resource_id uuid references public.resources(id) on delete set null;

update public.notifications
set category = notification_type
where category is null;

alter table public.notifications
  alter column category set not null,
  alter column category set default 'account_update',
  add constraint notifications_target_url_internal
    check (target_url like '/%' and target_url not like '//%' and target_url !~ E'[\\r\\n]'),
  add constraint notifications_campaign_user_unique unique (campaign_id, user_id);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_user_read_idx
  on public.notifications(user_id, read_at);

alter table public.notification_deliveries
  add constraint notification_deliveries_campaign_subscription_unique
    unique (campaign_id, subscription_id);

-- Browser clients retain select access and column-level update access only to
-- read_at. Service-role Edge Functions bypass RLS for trusted inserts.
revoke insert, delete on table public.notifications from authenticated;
revoke update on table public.notifications from authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

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

comment on column public.notification_preferences.notification_sound_enabled is
  'Controls foreground website audio only. Background sound remains under browser and operating-system control.';
comment on table public.notifications is
  'Private per-user notification history. Campaign notifications are unique per user while deliveries remain per subscription.';

commit;
