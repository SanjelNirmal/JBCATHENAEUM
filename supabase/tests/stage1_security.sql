begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'user_roles', 'role memberships table exists');
select has_table('public', 'audit_events', 'security audit table exists');
select has_function(
  'public',
  'set_user_role',
  array['uuid', 'app_role', 'boolean'],
  'trusted role mutation function exists'
);
select has_function(
  'public',
  'subscribe_to_newsletter',
  array['text'],
  'newsletter write boundary exists'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anonymous visitors cannot enumerate profiles'
);
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'role', 'UPDATE'),
  'authenticated users cannot update the legacy role field'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'name', 'UPDATE'),
  'authenticated users can update safe profile fields'
);
select ok(
  not has_table_privilege('anon', 'public.newsletter_subscriptions', 'INSERT'),
  'anonymous newsletter writes cannot bypass validation RPC'
);
select ok(
  not has_table_privilege('authenticated', 'public.user_roles', 'INSERT'),
  'role rows cannot be inserted directly by browser clients'
);
select ok(
  not has_table_privilege('authenticated', 'public.user_roles', 'UPDATE'),
  'role rows cannot be updated directly by browser clients'
);
select ok(
  not has_table_privilege('authenticated', 'public.user_roles', 'DELETE'),
  'role rows cannot be deleted directly by browser clients'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000123', true);
select throws_ok(
  $$select public.set_user_role(
    '00000000-0000-0000-0000-000000000123'::uuid,
    'admin'::public.app_role,
    true
  )$$,
  '42501',
  'Only a super administrator can change privileged roles',
  'an unprivileged caller cannot promote itself to admin'
);
select throws_ok(
  $$insert into public.resources (
    title, subject, faculty, semester, author_name, file_url
  ) values (
    'Unauthorized test', 'Security', 'BCA', '1st Semester', 'Policy test', 'https://example.invalid/file'
  )$$,
  '42501',
  'permission denied for table resources',
  'an unprivileged caller cannot insert a resource'
);

reset role;
select * from finish();
rollback;
