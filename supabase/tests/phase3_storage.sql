begin;

create extension if not exists pgtap with schema extensions;
select plan(29);

select has_table('public', 'resource_upload_sessions', 'upload session table exists');
select has_table('public', 'storage_settings', 'storage settings table exists');
select has_type('public', 'upload_session_status', 'upload status enum exists');
select has_function(
  'public', 'create_resource_upload_session',
  array['uuid','uuid','uuid','uuid','uuid','uuid','uuid','text','text','integer','text','text','bigint','uuid'],
  'service upload issuance RPC exists'
);
select has_function(
  'public', 'complete_resource_upload',
  array['uuid','uuid','bigint','text','integer','jsonb'],
  'service upload completion RPC exists'
);
select has_function(
  'public', 'fail_resource_upload',
  array['uuid','uuid','upload_session_status','text','jsonb'],
  'service upload failure RPC exists'
);
select has_function('public', 'increment_resource_download', array['uuid'], 'service download counter RPC exists');

select ok(exists(select 1 from storage.buckets where id = 'resource-quarantine'), 'quarantine bucket exists');
select ok(exists(select 1 from storage.buckets where id = 'resource-published'), 'published bucket exists');
select ok((select not public from storage.buckets where id = 'resource-quarantine'), 'quarantine bucket is private');
select ok((select not public from storage.buckets where id = 'resource-published'), 'published bucket is private');
select ok(
  (
    select file_size_limit = 26214400 and allowed_mime_types = array['application/pdf']
    from storage.buckets where id = 'resource-quarantine'
  ),
  'quarantine bucket enforces PDF and 25 MB limits'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects'),
  0,
  'browser clients have no direct Storage object policies'
);
select ok(
  (select is_nullable = 'YES' from information_schema.columns where table_schema = 'public' and table_name = 'resources' and column_name = 'file_url'),
  'new resources do not require a permanent URL'
);
select ok(
  not has_table_privilege('authenticated', 'public.resource_upload_sessions', 'INSERT'),
  'clients cannot issue their own upload sessions'
);
select ok(
  not has_table_privilege('anon', 'public.resource_upload_sessions', 'SELECT'),
  'anonymous clients cannot read upload sessions'
);
select ok(
  not has_table_privilege('authenticated', 'public.resource_upload_sessions', 'UPDATE'),
  'clients cannot update upload sessions directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.resource_upload_sessions', 'DELETE'),
  'clients cannot delete upload sessions directly'
);
select ok(
  not has_column_privilege('authenticated', 'public.resource_upload_sessions', 'storage_bucket', 'SELECT'),
  'clients cannot read upload bucket names from session rows'
);
select ok(
  not has_column_privilege('authenticated', 'public.resource_upload_sessions', 'storage_path', 'SELECT'),
  'clients cannot read upload object paths from session rows'
);
select ok(
  not has_column_privilege('anon', 'public.resource_versions', 'storage_path', 'SELECT'),
  'anonymous clients cannot read Storage paths'
);
select ok(
  not has_function_privilege('authenticated', 'public.import_legacy_resource(text,text,text,text,text,text,text,text)', 'EXECUTE'),
  'legacy browser import is disabled'
);
select ok(
  not has_function_privilege('authenticated', 'public.create_resource_upload_session(uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,integer,text,text,bigint,uuid)', 'EXECUTE'),
  'authenticated clients cannot call service issuance RPC directly'
);
select ok(
  has_function_privilege('service_role', 'public.create_resource_upload_session(uuid,uuid,uuid,uuid,uuid,uuid,uuid,text,text,integer,text,text,bigint,uuid)', 'EXECUTE'),
  'service role can issue upload sessions'
);
select ok(
  has_function_privilege('service_role', 'public.complete_resource_upload(uuid,uuid,bigint,text,integer,jsonb)', 'EXECUTE'),
  'service role can complete validated uploads'
);
select ok(
  has_function_privilege('service_role', 'public.fail_resource_upload(uuid,uuid,upload_session_status,text,jsonb)', 'EXECUTE'),
  'service role can record failed uploads'
);
select ok(
  has_function_privilege('service_role', 'public.increment_resource_download(uuid)', 'EXECUTE'),
  'service role can record downloads'
);
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'resource_versions_unique_clean_checksum'
      and indexdef ilike 'create unique index%'
  ),
  'clean PDF checksums are unique'
);
select ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.resource_upload_sessions'::regclass
      and contype = 'u'
  ),
  'upload object paths are uniquely constrained'
);

select * from finish();
rollback;
