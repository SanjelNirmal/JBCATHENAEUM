begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

select has_column('public', 'profiles', 'account_status', 'profiles have a separate account status');
select has_column('public', 'resources', 'search_vector', 'resources have a generated full-text vector');
select has_table('public', 'resource_download_events', 'download events support monthly analytics');
select has_table('public', 'content_removal_requests', 'content removal workflow is persisted');
select has_table('public', 'resource_deletion_jobs', 'recoverable storage cleanup jobs exist');
select has_function('public', 'search_public_resources', array['text','uuid','uuid','uuid','uuid','uuid','integer','timestamptz','timestamptz','text','integer','integer'], 'public catalog search RPC exists');
select has_function('public', 'public_platform_stats', array[]::text[], 'public aggregate RPC exists');
select has_function('public', 'admin_dashboard_metrics', array[]::text[], 'admin aggregate RPC exists');
select has_function('public', 'set_account_status', array['uuid','account_status','text'], 'audited account suspension RPC exists');
select has_function('public', 'update_user_profile_safe', array['uuid','text','text','text','text'], 'safe staff profile update RPC exists');
select has_function('public', 'assign_resource_reviewer', array['uuid','uuid'], 'reviewer assignment RPC exists');
select has_function('public', 'archive_review_submission', array['uuid','text'], 'audited review archive RPC exists');
select has_function('public', 'bulk_resource_state', array['uuid[]','text','text'], 'audited bulk resource RPC exists');
select has_function('public', 'permanently_delete_resource', array['uuid','uuid','jsonb'], 'retention-gated deletion RPC exists');
select has_function('public', 'create_content_removal_request', array['uuid','text','text','text','text','text','text','text'], 'service removal-request boundary exists');
select has_function('public', 'list_admin_resources', array['text','resource_status','uuid','uuid','uuid','uuid','timestamptz','timestamptz','text','integer','integer'], 'private admin resource listing exists');

select ok(exists(select 1 from pg_indexes where indexname = 'resources_search_vector_idx'), 'search vector is GIN indexed');
select ok(exists(select 1 from pg_indexes where indexname = 'resources_title_trgm_idx'), 'resource titles have typo-tolerant trigram index');
select ok(exists(select 1 from pg_indexes where indexname = 'resources_filter_idx'), 'catalog filters have a compound index');
select ok((select is_generated = 'ALWAYS' from information_schema.columns where table_schema = 'public' and table_name = 'resources' and column_name = 'search_vector'), 'search vector is stored and generated');

select ok(has_function_privilege('anon', 'public.search_public_resources(text,uuid,uuid,uuid,uuid,uuid,integer,timestamptz,timestamptz,text,integer,integer)', 'EXECUTE'), 'anonymous users may call the publication-safe search boundary');
select ok(not has_table_privilege('anon', 'public.resource_download_events', 'SELECT'), 'anonymous users cannot read download event records');
select ok(not has_table_privilege('authenticated', 'public.resource_download_events', 'INSERT'), 'browser clients cannot forge download events');
select ok(not has_function_privilege('authenticated', 'public.increment_resource_download(uuid)', 'EXECUTE'), 'browser clients cannot increment download analytics');
select ok(has_function_privilege('service_role', 'public.increment_resource_download(uuid)', 'EXECUTE'), 'trusted download function can write analytics');
select ok(not has_function_privilege('authenticated', 'public.permanently_delete_resource(uuid,uuid,jsonb)', 'EXECUTE'), 'browser clients cannot permanently delete resources');
select ok(has_function_privilege('service_role', 'public.permanently_delete_resource(uuid,uuid,jsonb)', 'EXECUTE'), 'trusted deletion function can apply retention-gated deletion');
select ok(not has_function_privilege('anon', 'public.create_content_removal_request(uuid,text,text,text,text,text,text,text)', 'EXECUTE'), 'anonymous users cannot bypass the rate-limited removal Edge Function');
select ok(not has_table_privilege('anon', 'public.content_removal_requests', 'INSERT'), 'anonymous users cannot insert removal requests directly');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'account_status', 'UPDATE'), 'users cannot update account status directly');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'suspended_by', 'UPDATE'), 'users cannot update suspension audit fields');
select ok(not has_column_privilege('authenticated', 'public.resources', 'owner_id', 'SELECT'), 'contributor identifiers remain unavailable through direct resource reads');
select ok(not has_function_privilege('anon', 'public.list_admin_resources(text,resource_status,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,integer)', 'EXECUTE'), 'anonymous users cannot call the admin resource listing');
select ok(has_function_privilege('authenticated', 'public.list_admin_resources(text,resource_status,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,integer)', 'EXECUTE'), 'authenticated sessions may reach the MFA-protected admin listing boundary');

select * from finish();
rollback;
