begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

select has_table('public', 'academic_posts', 'academic posts table exists');
select has_table('public', 'academic_post_categories', 'post categories table exists');
select has_table('public', 'academic_post_events', 'post events table exists');
select has_column('public', 'academic_posts', 'program_id', 'posts reuse the existing programs table');
select col_is_fk('public', 'academic_posts', 'program_id', 'post program is relational');
select col_is_fk('public', 'academic_posts', 'category_id', 'post category is relational');
select has_index('public', 'academic_posts', 'academic_posts_slug_lower_key', 'post slugs are indexed uniquely');
select has_index('public', 'academic_posts', 'academic_posts_search_idx', 'post full-text search is indexed');
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.academic_posts'::regclass),
  'academic posts force RLS'
);
select ok(
  (select coalesce(qual, '') ilike '%status%published%'
      and coalesce(qual, '') ilike '%published_at%'
      and coalesce(qual, '') ilike '%deleted_at%'
   from pg_policies
   where schemaname = 'public'
     and tablename = 'academic_posts'
     and policyname = 'academic_posts_public_read'),
  'public reads are limited to currently published non-deleted posts'
);
select ok(
  (select coalesce(with_check, '') ilike '%can_manage_academic_posts%'
   from pg_policies
   where schemaname = 'public'
     and tablename = 'academic_posts'
     and policyname = 'academic_posts_manager_insert'),
  'post inserts require the existing trusted role system'
);
select ok(not has_table_privilege('anon', 'public.academic_posts', 'INSERT'), 'anonymous users cannot insert posts');
select ok(not has_table_privilege('anon', 'public.academic_posts', 'UPDATE'), 'anonymous users cannot update posts');
select ok(not has_table_privilege('anon', 'public.academic_posts', 'DELETE'), 'anonymous users cannot delete posts');
select function_returns('public', 'increment_academic_post_view', array['text', 'text'], 'bigint', 'view RPC returns a count');
select function_privs_are(
  'public',
  'increment_academic_post_view',
  array['text', 'text'],
  'anon',
  array['EXECUTE'],
  'anonymous users can execute only the protected view boundary'
);
select ok(
  pg_get_functiondef('public.increment_academic_post_view(text,text)'::regprocedure)
    ilike '%status = ''published''%',
  'view increment verifies publication'
);
select ok(
  pg_get_functiondef('public.soft_delete_academic_post(uuid)'::regprocedure)
    ilike '%super_admin%',
  'soft deletion requires a super administrator'
);
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'academic_posts_one_primary_featured'
  ),
  'only one primary featured post is allowed'
);
select ok(
  exists (
    select 1 from storage.buckets
    where id = 'academic-post-covers'
      and not public
      and file_size_limit = 5242880
  ),
  'cover images use a private validated Storage bucket'
);

select * from finish();
rollback;
