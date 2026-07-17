begin;

create extension if not exists pgtap with schema extensions;
select plan(39);

select has_table('public', 'campuses', 'campuses table exists');
select has_table('public', 'faculties', 'faculties table exists');
select has_table('public', 'programs', 'programs table exists');
select has_table('public', 'curriculum_versions', 'curriculum versions table exists');
select has_table('public', 'terms', 'terms table exists');
select has_table('public', 'subjects', 'subjects table exists');
select has_table('public', 'resource_categories', 'resource categories table exists');

select has_table('public', 'resource_versions', 'resource versions table exists');
select has_table('public', 'resource_submissions', 'resource submissions table exists');
select has_table('public', 'resource_reviews', 'resource reviews table exists');
select has_table('public', 'review_comments', 'review comments table exists');
select has_table('public', 'notifications', 'notifications table exists');
select has_table('public', 'resource_reports', 'resource reports table exists');
select has_table('public', 'feedback_messages', 'feedback messages table exists');

select has_type('public', 'resource_status', 'resource status enum exists');
select has_column('public', 'resources', 'campus_id', 'resources have campus reference');
select has_column('public', 'resources', 'program_id', 'resources have program reference');
select has_column('public', 'resources', 'curriculum_version_id', 'resources have curriculum reference');
select has_column('public', 'resources', 'term_id', 'resources have term reference');
select has_column('public', 'resources', 'subject_id', 'resources have subject reference');
select has_column('public', 'resources', 'category_id', 'resources have category reference');
select has_column('public', 'resources', 'current_version_id', 'resources have current version reference');
select col_not_null('public', 'resources', 'subject_id', 'normalized subject is required');

select ok(
  (
    select count(*) >= 7
    from pg_constraint
    where conrelid = 'public.resources'::regclass and contype = 'f'
  ),
  'resources enforce normalized foreign keys'
);

select has_function(
  'public', 'import_legacy_resource',
  array['text', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'trusted legacy import bridge exists'
);
select has_function('public', 'archive_resource', array['uuid'], 'archive RPC exists');
select has_function('public', 'submit_resource', array['uuid', 'uuid'], 'submission RPC exists');
select has_function('public', 'claim_resource_review', array['uuid'], 'review claim RPC exists');
select has_function(
  'public', 'decide_resource_review',
  array['uuid', 'review_decision', 'text', 'text', 'text'],
  'review decision RPC exists'
);
select has_function('public', 'publish_resource', array['uuid'], 'publish RPC exists');
select has_function(
  'public', 'submit_resource_report', array['uuid', 'text', 'text'],
  'resource report RPC exists'
);
select has_function(
  'public', 'submit_feedback', array['text', 'text', 'text', 'text'],
  'feedback RPC exists'
);

select has_trigger(
  'public', 'resource_reviews', 'resource_reviews_prevent_self_review',
  'self-review prevention trigger exists'
);
select has_trigger(
  'public', 'audit_events', 'audit_events_infer_campus',
  'resource audit events infer their campus'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'UPDATE'),
  'audit events cannot be updated by clients'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'DELETE'),
  'audit events cannot be deleted by clients'
);
select ok(
  not has_table_privilege('anon', 'public.feedback_messages', 'INSERT'),
  'anonymous feedback cannot bypass its validating RPC'
);
select ok(
  not has_table_privilege('anon', 'public.resources', 'INSERT'),
  'anonymous resource creation is denied'
);
select ok(
  (
    select coalesce(qual, '') ilike '%published%'
       and coalesce(qual, '') ilike '%deleted_at%'
    from pg_policies
    where schemaname = 'public'
      and tablename = 'resources'
      and policyname = 'resources_public_read'
  ),
  'public resource policy requires published, non-deleted rows'
);

select * from finish();
rollback;
