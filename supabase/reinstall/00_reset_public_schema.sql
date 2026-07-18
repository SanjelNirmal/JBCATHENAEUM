-- JBC ATHENAEUM destructive public-schema reset.
--
-- DATA LOSS: this removes every application table, row, policy, trigger,
-- function, enum, and view in the public schema.
--
-- It intentionally preserves Supabase-managed schemas including auth,
-- storage, realtime, vault, extensions, and supabase_migrations. Existing
-- auth.users accounts survive and migration 001 rebuilds their profiles.
--
-- Run this file once in the Supabase SQL Editor, then replay migrations
-- 202607170001 through 202607180010 in filename order as documented in
-- README.md in this directory.

begin;

-- This trigger depends on a public function. Dropping it explicitly makes the
-- Auth boundary clear and migration 001 recreates it after the schema rebuild.
drop trigger if exists on_auth_user_created on auth.users;

drop schema if exists public cascade;
create schema public authorization postgres;

comment on schema public is
  'JBC Athenaeum application schema; access is controlled by explicit grants and RLS.';

revoke all on schema public from public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

-- Migrations execute as postgres. Trusted Edge Functions use service_role and
-- need privileges on objects created during the replay. Browser roles receive
-- only the explicit least-privilege grants inside the migrations.
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;

commit;
