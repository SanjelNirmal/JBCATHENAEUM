-- Run only after all eight migrations have completed successfully.
-- Change only the owner_email value below to the verified Auth email.
-- This does not create an Auth user or store the email in a public table.

begin;

do $$
declare
  owner_email constant text := 'OWNER_EMAIL_HERE';
  owner_id uuid;
begin
  if owner_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'Set owner_email to a valid, verified Supabase Auth email';
  end if;

  select id
  into owner_id
  from auth.users
  where lower(email) = lower(owner_email);

  if owner_id is null then
    raise exception 'No Supabase Auth user exists for the supplied owner email';
  end if;

  insert into public.profiles (id, name, faculty)
  select
    users.id,
    coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(users.email, '@', 1), ''),
      'Platform Owner'
    ),
    coalesce(nullif(trim(users.raw_user_meta_data ->> 'faculty'), ''), 'Administration')
  from auth.users as users
  where users.id = owner_id
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role, granted_by)
  values (owner_id, 'super_admin'::public.app_role, null)
  on conflict (user_id, role) do nothing;

  insert into public.audit_events (
    actor_id, action, entity_type, entity_id, metadata
  ) values (
    null,
    'role.bootstrapped',
    'user',
    owner_id,
    jsonb_build_object('role', 'super_admin', 'source', 'clean_reinstall')
  );
end
$$;

commit;
