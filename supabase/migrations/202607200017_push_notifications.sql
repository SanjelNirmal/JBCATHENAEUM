-- Cross-platform push subscriptions, preferences, campaigns, jobs, and audit.
begin;

alter table public.notification_preferences
  add column if not exists new_resources boolean not null default true,
  add column if not exists past_questions boolean not null default true,
  add column if not exists account_security boolean not null default true,
  add column if not exists program_id uuid references public.programs(id) on delete set null,
  add column if not exists term_id uuid references public.terms(id) on delete set null,
  add column if not exists subject_ids uuid[] not null default '{}',
  add column if not exists quiet_hours_enabled boolean not null default false,
  add column if not exists quiet_hours_start time,
  add column if not exists quiet_hours_end time,
  add column if not exists timezone text;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null,
  device_name text,
  browser_name text,
  app_version text,
  program_id uuid references public.programs(id) on delete set null,
  term_id uuid references public.terms(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_token_unique unique (token),
  constraint push_subscriptions_platform_check check (platform in ('web', 'android', 'ios')),
  constraint push_subscriptions_token_length check (length(token) between 20 and 4096),
  constraint push_subscriptions_device_name_length check (device_name is null or length(device_name) <= 160),
  constraint push_subscriptions_browser_name_length check (browser_name is null or length(browser_name) <= 160)
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index push_subscriptions_enabled_idx on public.push_subscriptions(enabled) where enabled;
create index push_subscriptions_platform_idx on public.push_subscriptions(platform);
create index push_subscriptions_subject_idx on public.push_subscriptions(subject_id) where subject_id is not null;
create index push_subscriptions_last_seen_idx on public.push_subscriptions(last_seen_at desc);
create trigger push_subscriptions_set_updated_at before update on public.push_subscriptions
for each row execute function public.set_updated_at();

create table public.push_notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null,
  target_url text,
  resource_id uuid references public.resources(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  audience jsonb not null default '{}',
  status text not null default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_campaign_title_length check (length(trim(title)) between 1 and 120),
  constraint push_campaign_body_length check (length(trim(body)) between 1 and 500),
  constraint push_campaign_status_check check (status in ('draft','queued','sending','sent','partially_failed','failed','cancelled')),
  constraint push_campaign_internal_url check (target_url is null or (target_url like '/%' and target_url not like '//%'))
);
create index push_campaign_status_schedule_idx on public.push_notification_campaigns(status, scheduled_for);
create trigger push_campaigns_set_updated_at before update on public.push_notification_campaigns
for each row execute function public.set_updated_at();

create table public.push_notification_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.push_notification_campaigns(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  idempotency_key text not null unique,
  payload jsonb not null,
  status text not null default 'queued',
  attempts smallint not null default 0,
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint push_jobs_status_check check (status in ('queued','processing','completed','failed','cancelled'))
);
create index push_jobs_ready_idx on public.push_notification_jobs(status, available_at) where status = 'queued';

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.push_notification_campaigns(id) on delete cascade,
  subscription_id uuid references public.push_subscriptions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending',
  provider_message_id text,
  error_code text,
  error_message text,
  attempted_at timestamptz not null default now(),
  constraint notification_delivery_status_check check (status in ('pending','sent','failed','invalid_token','skipped','disabled'))
);
create index notification_deliveries_campaign_idx on public.notification_deliveries(campaign_id, status);
create index notification_deliveries_user_idx on public.notification_deliveries(user_id, attempted_at desc);

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
alter table public.push_notification_campaigns enable row level security;
alter table public.push_notification_campaigns force row level security;
alter table public.push_notification_jobs enable row level security;
alter table public.push_notification_jobs force row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_deliveries force row level security;

create policy push_subscriptions_own_read on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_subscriptions_own_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_subscriptions_own_update on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_subscriptions_own_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
create policy push_campaigns_admin_all on public.push_notification_campaigns for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

revoke all on public.push_subscriptions, public.push_notification_campaigns, public.push_notification_jobs, public.notification_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
grant select, insert, update, delete on public.push_notification_campaigns to authenticated;

comment on table public.push_subscriptions is 'Private FCM registration tokens. Normal clients can access only their own rows through RLS.';
comment on table public.notification_deliveries is 'Service-role-only delivery audit; never contains registration tokens.';
commit;
