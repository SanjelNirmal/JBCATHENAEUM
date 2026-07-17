begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select is(
  (
    select count(*)
    from public.programs
    join public.campuses on campuses.id = programs.campus_id
    where campuses.slug = 'jana-bhawana-campus'
      and programs.slug in ('bca', 'bicte', 'bbs', 'mbs')
      and programs.is_active
  ),
  4::bigint,
  'four verified Jana Bhawana programs are contribution-ready'
);

select is(
  (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bca'
      and terms.term_number between 1 and 8
      and terms.is_active
  ),
  8::bigint,
  'BCA has all eight active semesters'
);

select ok(
  (
    select count(*) >= 58
    from public.subjects
    join public.curriculum_versions
      on curriculum_versions.id = subjects.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bca'
      and subjects.is_active
  ),
  'BCA has the complete core and elective catalog'
);

select ok(
  exists (
    select 1
    from public.subjects
    join public.terms on terms.id = subjects.term_id
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bca'
      and terms.term_number = 1
      and subjects.code = 'BCA 101'
      and subjects.name = 'Computer Fundamentals and Applications'
  ),
  'BCA first-semester course codes are seeded'
);

select ok(
  exists (
    select 1
    from public.subjects
    join public.terms on terms.id = subjects.term_id
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bca'
      and terms.term_number = 8
      and subjects.code = 'BCA 451'
      and subjects.name = 'Cloud Computing'
  ),
  'BCA eighth-semester courses are seeded'
);

select is(
  (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bicte'
      and terms.term_number between 1 and 8
      and terms.is_active
  ),
  8::bigint,
  'BICTE has all eight active semesters'
);

select ok(
  (
    select count(*) >= 46
    from public.subjects
    join public.curriculum_versions
      on curriculum_versions.id = subjects.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bicte'
      and subjects.is_active
  ),
  'BICTE has its published subject structure'
);

select is(
  (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bbs'
      and terms.term_number between 1 and 4
      and terms.is_active
  ),
  4::bigint,
  'BBS has all four active years'
);

select ok(
  (
    select count(*) >= 21
    from public.subjects
    join public.curriculum_versions
      on curriculum_versions.id = subjects.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'bbs'
      and subjects.is_active
  ),
  'BBS has its published subject structure'
);

select is(
  (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'mbs'
      and terms.term_number between 1 and 4
      and terms.is_active
  ),
  4::bigint,
  'MBS has all four active semesters'
);

select ok(
  (
    select count(*) >= 19
    from public.subjects
    join public.curriculum_versions
      on curriculum_versions.id = subjects.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = subjects.program_id
    where programs.slug = 'mbs'
      and subjects.is_active
  ),
  'MBS has its published subject structure'
);

select is(
  (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    where programs.slug = 'bca'
      and terms.slug = '4th-semester'
  ),
  1::bigint,
  'the legacy BCA fourth-semester row is reused instead of duplicated'
);

select * from finish();
rollback;
