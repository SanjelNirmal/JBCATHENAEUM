-- JBC ATHENAEUM Phase 2: normalized academic structure and versioned resources.
-- Legacy resource text columns remain available during the frontend transition,
-- but normalized foreign keys become the authoritative model.

begin;

create or replace function public.slugify(input text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select coalesce(
    nullif(trim(both '-' from regexp_replace(lower(trim(input)), '[^a-z0-9]+', '-', 'g')), ''),
    'item'
  );
$$;

revoke all on function public.slugify(text) from public;
grant execute on function public.slugify(text) to authenticated;

do $$
begin
  create type public.resource_status as enum (
    'draft', 'submitted', 'under_review', 'changes_requested',
    'approved', 'published', 'rejected', 'archived'
  );
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.resource_scan_status as enum (
    'pending', 'clean', 'infected', 'rejected', 'legacy_unverified'
  );
exception when duplicate_object then null;
end
$$;

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  code text,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campuses_name_length check (length(trim(name)) between 2 and 160)
);

create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id) on delete restrict,
  name text not null,
  slug text not null,
  code text,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campus_id, slug),
  unique (id, campus_id),
  constraint faculties_name_length check (length(trim(name)) between 2 and 160)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id) on delete restrict,
  faculty_id uuid not null references public.faculties(id) on delete restrict,
  name text not null,
  slug text not null,
  code text,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campus_id, slug),
  unique (id, campus_id),
  foreign key (faculty_id, campus_id) references public.faculties(id, campus_id) on delete restrict,
  constraint programs_name_length check (length(trim(name)) between 2 and 160)
);

create table public.curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  name text not null,
  slug text not null,
  effective_year integer,
  is_current boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, slug),
  unique (id, program_id),
  constraint curriculum_year_range check (
    effective_year is null or effective_year between 1959 and 2200
  )
);

create unique index curriculum_versions_one_current_per_program
  on public.curriculum_versions(program_id)
  where is_current;

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete restrict,
  name text not null,
  slug text not null,
  term_number integer,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (curriculum_version_id, slug),
  unique (id, program_id, curriculum_version_id),
  foreign key (curriculum_version_id, program_id)
    references public.curriculum_versions(id, program_id) on delete restrict,
  constraint terms_number_positive check (term_number is null or term_number > 0)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  curriculum_version_id uuid not null references public.curriculum_versions(id) on delete restrict,
  term_id uuid not null references public.terms(id) on delete restrict,
  name text not null,
  slug text not null,
  code text,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (term_id, slug),
  unique (id, program_id, curriculum_version_id, term_id),
  foreign key (term_id, program_id, curriculum_version_id)
    references public.terms(id, program_id, curriculum_version_id) on delete restrict,
  constraint subjects_name_length check (length(trim(name)) between 2 and 200)
);

create table public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campus_id, slug),
  unique (id, campus_id)
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'campuses', 'faculties', 'programs', 'curriculum_versions',
    'terms', 'subjects', 'resource_categories'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end
$$;

alter table public.resources add column campus_id uuid references public.campuses(id) on delete restrict;
alter table public.resources add column program_id uuid references public.programs(id) on delete restrict;
alter table public.resources add column curriculum_version_id uuid references public.curriculum_versions(id) on delete restrict;
alter table public.resources add column term_id uuid references public.terms(id) on delete restrict;
alter table public.resources add column subject_id uuid references public.subjects(id) on delete restrict;
alter table public.resources add column category_id uuid references public.resource_categories(id) on delete restrict;
alter table public.resources add column slug text;
alter table public.resources add column description text;
alter table public.resources add column academic_year integer;
alter table public.resources add column status public.resource_status not null default 'draft';
alter table public.resources add column owner_id uuid references auth.users(id) on delete set null;
alter table public.resources add column reviewer_id uuid references auth.users(id) on delete set null;
alter table public.resources add column current_version_id uuid;
alter table public.resources add column published_at timestamptz;
alter table public.resources add column reviewed_at timestamptz;
alter table public.resources add column updated_at timestamptz not null default now();
alter table public.resources add column archived_at timestamptz;
alter table public.resources add column deleted_at timestamptz;
alter table public.resources add column download_count bigint not null default 0;
alter table public.resources add column view_count bigint not null default 0;

alter table public.resources add constraint resources_academic_year_range
  check (academic_year is null or academic_year between 1959 and 2200);
alter table public.resources add constraint resources_download_count_nonnegative check (download_count >= 0);
alter table public.resources add constraint resources_view_count_nonnegative check (view_count >= 0);
alter table public.resources add constraint resources_program_campus_fk
  foreign key (program_id, campus_id) references public.programs(id, campus_id) on delete restrict;
alter table public.resources add constraint resources_curriculum_program_fk
  foreign key (curriculum_version_id, program_id)
  references public.curriculum_versions(id, program_id) on delete restrict;
alter table public.resources add constraint resources_term_hierarchy_fk
  foreign key (term_id, program_id, curriculum_version_id)
  references public.terms(id, program_id, curriculum_version_id) on delete restrict;
alter table public.resources add constraint resources_subject_hierarchy_fk
  foreign key (subject_id, program_id, curriculum_version_id, term_id)
  references public.subjects(id, program_id, curriculum_version_id, term_id) on delete restrict;
alter table public.resources add constraint resources_category_campus_fk
  foreign key (category_id, campus_id)
  references public.resource_categories(id, campus_id) on delete restrict;

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

do $$
declare
  default_campus_id uuid;
  default_category_id uuid;
  faculty_id_value uuid;
  program_id_value uuid;
  curriculum_id_value uuid;
  term_id_value uuid;
  row_value record;
begin
  insert into public.campuses (name, slug, code, display_order)
  values ('Jana Bhawana Campus', 'jana-bhawana-campus', 'JBC', 1)
  on conflict (slug) do update set name = excluded.name
  returning id into default_campus_id;

  insert into public.resource_categories (campus_id, name, slug, display_order)
  values (default_campus_id, 'Academic Notes', 'academic-notes', 1)
  on conflict (campus_id, slug) do update set name = excluded.name
  returning id into default_category_id;

  insert into public.resource_categories (campus_id, name, slug, display_order)
  values
    (default_campus_id, 'Past Questions', 'past-questions', 2),
    (default_campus_id, 'Research', 'research', 3)
  on conflict (campus_id, slug) do nothing;

  for row_value in
    select distinct coalesce(nullif(trim(faculty), ''), 'General Studies') as faculty_name
    from public.resources
  loop
    insert into public.faculties (campus_id, name, slug)
    values (default_campus_id, row_value.faculty_name, public.slugify(row_value.faculty_name))
    on conflict (campus_id, slug) do update set name = excluded.name
    returning id into faculty_id_value;

    insert into public.programs (campus_id, faculty_id, name, slug, code)
    values (
      default_campus_id,
      faculty_id_value,
      row_value.faculty_name,
      public.slugify(row_value.faculty_name),
      upper(left(regexp_replace(row_value.faculty_name, '[^A-Za-z0-9]', '', 'g'), 16))
    )
    on conflict (campus_id, slug) do update set faculty_id = excluded.faculty_id
    returning id into program_id_value;

    insert into public.curriculum_versions (program_id, name, slug, is_current)
    values (program_id_value, 'Legacy / Current Curriculum', 'legacy-current', true)
    on conflict (program_id, slug) do update set is_current = true
    returning id into curriculum_id_value;
  end loop;

  for row_value in
    select distinct
      coalesce(nullif(trim(faculty), ''), 'General Studies') as faculty_name,
      coalesce(nullif(trim(semester), ''), 'General Term') as term_name
    from public.resources
  loop
    select programs.id, curriculum_versions.id
    into program_id_value, curriculum_id_value
    from public.programs
    join public.curriculum_versions on curriculum_versions.program_id = programs.id
    where programs.campus_id = default_campus_id
      and programs.slug = public.slugify(row_value.faculty_name)
      and curriculum_versions.slug = 'legacy-current';

    insert into public.terms (
      program_id, curriculum_version_id, name, slug, term_number, display_order
    ) values (
      program_id_value,
      curriculum_id_value,
      row_value.term_name,
      public.slugify(row_value.term_name),
      nullif(substring(row_value.term_name from '[0-9]+'), '')::integer,
      coalesce(nullif(substring(row_value.term_name from '[0-9]+'), '')::integer, 0)
    )
    on conflict (curriculum_version_id, slug) do update set name = excluded.name
    returning id into term_id_value;
  end loop;

  for row_value in
    select distinct
      coalesce(nullif(trim(faculty), ''), 'General Studies') as faculty_name,
      coalesce(nullif(trim(semester), ''), 'General Term') as term_name,
      coalesce(nullif(trim(subject), ''), 'General Subject') as subject_name
    from public.resources
  loop
    select programs.id, curriculum_versions.id, terms.id
    into program_id_value, curriculum_id_value, term_id_value
    from public.programs
    join public.curriculum_versions on curriculum_versions.program_id = programs.id
    join public.terms on terms.curriculum_version_id = curriculum_versions.id
    where programs.campus_id = default_campus_id
      and programs.slug = public.slugify(row_value.faculty_name)
      and curriculum_versions.slug = 'legacy-current'
      and terms.slug = public.slugify(row_value.term_name);

    insert into public.subjects (
      program_id, curriculum_version_id, term_id, name, slug
    ) values (
      program_id_value,
      curriculum_id_value,
      term_id_value,
      row_value.subject_name,
      public.slugify(row_value.subject_name)
    )
    on conflict (term_id, slug) do update set name = excluded.name;
  end loop;

  update public.resources as resources
  set
    campus_id = default_campus_id,
    program_id = programs.id,
    curriculum_version_id = curriculum_versions.id,
    term_id = terms.id,
    subject_id = subjects.id,
    category_id = default_category_id,
    slug = public.slugify(resources.title) || '-' || left(replace(resources.id::text, '-', ''), 8),
    status = 'published'::public.resource_status,
    owner_id = resources.author_id,
    published_at = coalesce(resources.created_at, now())
  from public.programs
  join public.curriculum_versions on curriculum_versions.program_id = programs.id
  join public.terms on terms.curriculum_version_id = curriculum_versions.id
  join public.subjects on subjects.term_id = terms.id
  where programs.campus_id = default_campus_id
    and programs.slug = public.slugify(coalesce(nullif(trim(resources.faculty), ''), 'General Studies'))
    and curriculum_versions.slug = 'legacy-current'
    and terms.slug = public.slugify(coalesce(nullif(trim(resources.semester), ''), 'General Term'))
    and subjects.slug = public.slugify(coalesce(nullif(trim(resources.subject), ''), 'General Subject'));
end
$$;

do $$
begin
  if exists (
    select 1 from public.resources
    where campus_id is null or program_id is null or curriculum_version_id is null
       or term_id is null or subject_id is null or category_id is null or slug is null
  ) then
    raise exception 'Phase 2 resource backfill left unresolved normalized references';
  end if;
end
$$;

alter table public.resources alter column campus_id set not null;
alter table public.resources alter column program_id set not null;
alter table public.resources alter column curriculum_version_id set not null;
alter table public.resources alter column term_id set not null;
alter table public.resources alter column subject_id set not null;
alter table public.resources alter column category_id set not null;
alter table public.resources alter column slug set not null;

create unique index resources_campus_slug_key on public.resources(campus_id, slug);
create index resources_public_listing_idx
  on public.resources(status, published_at desc)
  where deleted_at is null;
create index resources_subject_idx on public.resources(subject_id, status);
create index resources_owner_idx on public.resources(owner_id, created_at desc);

create table public.resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  version_number integer not null,
  storage_bucket text,
  storage_path text,
  legacy_external_url text,
  original_filename text not null,
  safe_filename text not null,
  mime_type text not null,
  byte_size bigint,
  page_count integer,
  sha256_checksum text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  scan_status public.resource_scan_status not null default 'pending',
  scan_result jsonb not null default '{}'::jsonb,
  is_current boolean not null default false,
  unique (resource_id, version_number),
  constraint resource_versions_source_check check (
    legacy_external_url is not null
    or (storage_bucket is not null and storage_path is not null)
  ),
  constraint resource_versions_byte_size_positive check (byte_size is null or byte_size > 0),
  constraint resource_versions_page_count_positive check (page_count is null or page_count > 0),
  constraint resource_versions_checksum_format check (
    sha256_checksum is null or sha256_checksum ~ '^[a-f0-9]{64}$'
  )
);

create unique index resource_versions_one_current
  on public.resource_versions(resource_id)
  where is_current;
create unique index resource_versions_storage_object_key
  on public.resource_versions(storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null;
create index resource_versions_checksum_idx
  on public.resource_versions(sha256_checksum)
  where sha256_checksum is not null;

insert into public.resource_versions (
  resource_id,
  version_number,
  legacy_external_url,
  original_filename,
  safe_filename,
  mime_type,
  uploaded_by,
  scan_status,
  is_current,
  created_at
)
select
  resources.id,
  1,
  resources.file_url,
  resources.title || case when lower(coalesce(resources.resource_type, 'pdf')) = 'pdf' then '.pdf' else '' end,
  resources.id::text || case when lower(coalesce(resources.resource_type, 'pdf')) = 'pdf' then '.pdf' else '.bin' end,
  case when lower(coalesce(resources.resource_type, 'pdf')) = 'pdf'
    then 'application/pdf' else 'application/octet-stream' end,
  resources.owner_id,
  'legacy_unverified'::public.resource_scan_status,
  true,
  resources.created_at
from public.resources as resources
on conflict (resource_id, version_number) do nothing;

update public.resources as resources
set current_version_id = versions.id
from public.resource_versions as versions
where versions.resource_id = resources.id and versions.is_current;

alter table public.resources
  add constraint resources_current_version_fk
  foreign key (current_version_id) references public.resource_versions(id) on delete set null;

do $$
declare
  policy_record record;
  table_name text;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'campuses', 'faculties', 'programs', 'curriculum_versions',
        'terms', 'subjects', 'resource_categories', 'resources', 'resource_versions'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;

  foreach table_name in array array[
    'campuses', 'faculties', 'programs', 'curriculum_versions',
    'terms', 'subjects', 'resource_categories', 'resource_versions'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end
$$;

create policy campuses_active_read on public.campuses
for select to anon, authenticated using (is_active or public.is_platform_admin());
create policy faculties_active_read on public.faculties
for select to anon, authenticated using (is_active or public.is_platform_admin());
create policy programs_active_read on public.programs
for select to anon, authenticated using (is_active or public.is_platform_admin());
create policy curriculum_versions_active_read on public.curriculum_versions
for select to anon, authenticated using (is_active or public.is_platform_admin());
create policy terms_active_read on public.terms
for select to anon, authenticated using (is_active or public.is_platform_admin());
create policy subjects_active_read on public.subjects
for select to anon, authenticated using (is_active or public.is_platform_admin());
create policy resource_categories_active_read on public.resource_categories
for select to anon, authenticated using (is_active or public.is_platform_admin());

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'campuses', 'faculties', 'programs', 'curriculum_versions',
    'terms', 'subjects', 'resource_categories'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      table_name || '_admin_manage',
      table_name
    );
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select on table public.%I to anon, authenticated', table_name);
    execute format('grant insert, update, delete on table public.%I to authenticated', table_name);
  end loop;
end
$$;

create policy resources_public_read on public.resources
for select to anon, authenticated
using (
  status = 'published'::public.resource_status
  and deleted_at is null
  and exists (select 1 from public.campuses where campuses.id = resources.campus_id and campuses.is_active)
  and exists (select 1 from public.programs where programs.id = resources.program_id and programs.is_active)
  and exists (select 1 from public.curriculum_versions where curriculum_versions.id = resources.curriculum_version_id and curriculum_versions.is_active)
  and exists (select 1 from public.terms where terms.id = resources.term_id and terms.is_active)
  and exists (select 1 from public.subjects where subjects.id = resources.subject_id and subjects.is_active)
  and exists (select 1 from public.resource_categories where resource_categories.id = resources.category_id and resource_categories.is_active)
);

create policy resources_owner_read on public.resources
for select to authenticated using (owner_id = auth.uid());

create policy resources_review_team_read on public.resources
for select to authenticated
using (
  public.has_role('moderator'::public.app_role)
  or public.is_platform_admin()
);

create policy resource_versions_public_read on public.resource_versions
for select to anon, authenticated
using (
  exists (
    select 1 from public.resources
    where resources.id = resource_versions.resource_id
      and resources.status = 'published'::public.resource_status
      and resources.deleted_at is null
  )
);

create policy resource_versions_owner_or_review_read on public.resource_versions
for select to authenticated
using (
  exists (
    select 1 from public.resources
    where resources.id = resource_versions.resource_id
      and (
        resources.owner_id = auth.uid()
        or public.has_role('moderator'::public.app_role)
        or public.is_platform_admin()
      )
  )
);

revoke all on table public.resources from anon, authenticated;
grant select (
  id, campus_id, program_id, curriculum_version_id, term_id, subject_id, category_id,
  title, slug, description, academic_year, resource_type, status, current_version_id,
  published_at, created_at, updated_at, download_count, view_count,
  faculty, semester, subject, author_name, file_url, file_size
) on public.resources to anon, authenticated;
revoke all on table public.resource_versions from anon, authenticated;
grant select (
  id, resource_id, version_number, mime_type, byte_size, page_count,
  created_at, scan_status, is_current
) on public.resource_versions to anon, authenticated;

create or replace function public.import_legacy_resource(
  resource_title text,
  faculty_name text,
  term_name text,
  subject_name text,
  resource_author_name text,
  legacy_file_url text,
  legacy_file_size text default null,
  supplied_resource_type text default 'PDF'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  campus_id_value uuid;
  faculty_id_value uuid;
  program_id_value uuid;
  curriculum_id_value uuid;
  term_id_value uuid;
  subject_id_value uuid;
  category_id_value uuid;
  resource_id_value uuid := gen_random_uuid();
  version_id_value uuid := gen_random_uuid();
begin
  if actor is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role is required';
  end if;
  if resource_title is null or faculty_name is null or term_name is null
     or subject_name is null or resource_author_name is null or legacy_file_url is null
     or length(trim(resource_title)) not between 3 and 240
     or length(trim(faculty_name)) not between 2 and 160
     or length(trim(term_name)) not between 2 and 160
     or length(trim(subject_name)) not between 2 and 200
     or length(trim(resource_author_name)) not between 2 and 160 then
    raise exception using errcode = '22023', message = 'Resource and academic labels are invalid';
  end if;
  if length(legacy_file_url) > 2048 or legacy_file_url !~* '^https://' then
    raise exception using errcode = '22023', message = 'Legacy resource URL must use HTTPS';
  end if;

  select id into campus_id_value from public.campuses where slug = 'jana-bhawana-campus';

  insert into public.faculties (campus_id, name, slug)
  values (campus_id_value, trim(faculty_name), public.slugify(faculty_name))
  on conflict (campus_id, slug) do update set name = excluded.name
  returning id into faculty_id_value;

  insert into public.programs (campus_id, faculty_id, name, slug)
  values (campus_id_value, faculty_id_value, trim(faculty_name), public.slugify(faculty_name))
  on conflict (campus_id, slug) do update set faculty_id = excluded.faculty_id
  returning id into program_id_value;

  insert into public.curriculum_versions (program_id, name, slug, is_current)
  values (program_id_value, 'Legacy / Current Curriculum', 'legacy-current', true)
  on conflict (program_id, slug) do update set is_current = true
  returning id into curriculum_id_value;

  insert into public.terms (program_id, curriculum_version_id, name, slug, term_number, display_order)
  values (
    program_id_value,
    curriculum_id_value,
    trim(term_name),
    public.slugify(term_name),
    nullif(substring(term_name from '[0-9]+'), '')::integer,
    coalesce(nullif(substring(term_name from '[0-9]+'), '')::integer, 0)
  )
  on conflict (curriculum_version_id, slug) do update set name = excluded.name
  returning id into term_id_value;

  insert into public.subjects (program_id, curriculum_version_id, term_id, name, slug)
  values (program_id_value, curriculum_id_value, term_id_value, trim(subject_name), public.slugify(subject_name))
  on conflict (term_id, slug) do update set name = excluded.name
  returning id into subject_id_value;

  select id into category_id_value
  from public.resource_categories
  where campus_id = campus_id_value and slug = 'academic-notes';

  insert into public.resources (
    id, campus_id, program_id, curriculum_version_id, term_id, subject_id, category_id,
    title, slug, status, owner_id, published_at,
    faculty, semester, subject, author_name, author_id, file_url, file_size, resource_type
  ) values (
    resource_id_value, campus_id_value, program_id_value, curriculum_id_value, term_id_value,
    subject_id_value, category_id_value, trim(resource_title),
    public.slugify(resource_title) || '-' || left(replace(resource_id_value::text, '-', ''), 8),
    'published'::public.resource_status, actor, now(),
    trim(faculty_name), trim(term_name), trim(subject_name), trim(resource_author_name),
    actor, legacy_file_url, legacy_file_size, upper(trim(supplied_resource_type))
  );

  insert into public.resource_versions (
    id, resource_id, version_number, legacy_external_url, original_filename,
    safe_filename, mime_type, uploaded_by, scan_status, is_current
  ) values (
    version_id_value, resource_id_value, 1, legacy_file_url,
    trim(resource_title) || case when lower(supplied_resource_type) = 'pdf' then '.pdf' else '' end,
    resource_id_value::text || case when lower(supplied_resource_type) = 'pdf' then '.pdf' else '.bin' end,
    case when lower(supplied_resource_type) = 'pdf' then 'application/pdf' else 'application/octet-stream' end,
    actor, 'legacy_unverified'::public.resource_scan_status, true
  );

  update public.resources set current_version_id = version_id_value where id = resource_id_value;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (
    actor,
    'resource.legacy_imported',
    'resource',
    resource_id_value,
    jsonb_build_object('campus_id', campus_id_value, 'subject_id', subject_id_value)
  );

  return resource_id_value;
end;
$$;

revoke all on function public.import_legacy_resource(text, text, text, text, text, text, text, text) from public;
grant execute on function public.import_legacy_resource(text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.archive_resource(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare previous_status public.resource_status;
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role is required';
  end if;

  select status into previous_status from public.resources where id = target_resource_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Resource not found'; end if;

  update public.resources
  set status = 'archived'::public.resource_status, archived_at = now()
  where id = target_resource_id;

  insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'resource.archived', 'resource', target_resource_id, jsonb_build_object('previous_status', previous_status));
end;
$$;

revoke all on function public.archive_resource(uuid) from public;
grant execute on function public.archive_resource(uuid) to authenticated;

create or replace function public.restore_resource(target_resource_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role is required';
  end if;

  update public.resources
  set
    status = case when current_version_id is null
      then 'draft'::public.resource_status else 'published'::public.resource_status end,
    archived_at = null,
    deleted_at = null,
    published_at = case when current_version_id is null then published_at else coalesce(published_at, now()) end
  where id = target_resource_id and status = 'archived'::public.resource_status;

  if not found then raise exception using errcode = 'P0002', message = 'Archived resource not found'; end if;

  insert into public.audit_events (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'resource.restored', 'resource', target_resource_id);
end;
$$;

revoke all on function public.restore_resource(uuid) from public;
grant execute on function public.restore_resource(uuid) to authenticated;

comment on column public.resources.faculty is 'Deprecated compatibility label; use program_id and normalized joins.';
comment on column public.resources.semester is 'Deprecated compatibility label; use term_id.';
comment on column public.resources.subject is 'Deprecated compatibility label; use subject_id.';
comment on column public.resources.file_url is 'Deprecated external URL bridge; Phase 3 uses private Storage and resource_versions.';
comment on function public.import_legacy_resource(text, text, text, text, text, text, text, text) is
  'Temporary audited admin bridge for legacy HTTPS resources; remove after Phase 3 Storage rollout.';

commit;
