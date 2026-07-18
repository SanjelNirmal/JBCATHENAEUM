begin;

-- Keep both BCA course structures available. The existing 2025 catalog is
-- labelled as the new syllabus; the attached 126-credit TU BCA structure is
-- installed as the old syllabus currently studied at the campus.
do $$
declare
  bca_program_id uuid;
  current_curriculum_id uuid;
  old_curriculum_id uuid;
begin
  select programs.id
  into bca_program_id
  from public.programs
  join public.campuses on campuses.id = programs.campus_id
  where campuses.slug = 'jana-bhawana-campus'
    and programs.slug = 'bca'
  limit 1;

  if bca_program_id is null then
    raise exception 'Jana Bhawana Campus BCA program must be installed first';
  end if;

  select id
  into current_curriculum_id
  from public.curriculum_versions
  where program_id = bca_program_id
    and is_current
  limit 1;

  if current_curriculum_id is null then
    raise exception 'The current BCA curriculum must be installed first';
  end if;

  update public.curriculum_versions
  set
    name = 'New BCA syllabus (2025)',
    effective_year = coalesce(effective_year, 2025),
    display_order = 10,
    is_active = true
  where id = current_curriculum_id;

  insert into public.curriculum_versions (
    program_id,
    name,
    slug,
    effective_year,
    is_current,
    display_order,
    is_active
  )
  values (
    bca_program_id,
    'Old BCA syllabus (currently studied)',
    'old-bca-syllabus',
    null,
    false,
    5,
    true
  )
  on conflict (program_id, slug) do update
  set
    name = excluded.name,
    is_current = false,
    display_order = excluded.display_order,
    is_active = true
  returning id into old_curriculum_id;

  insert into public.terms (
    program_id,
    curriculum_version_id,
    name,
    slug,
    term_number,
    display_order,
    is_active
  )
  select
    bca_program_id,
    old_curriculum_id,
    seed.name,
    public.slugify(seed.name),
    seed.term_number,
    seed.term_number,
    true
  from (
    values
      (1, '1st Semester'),
      (2, '2nd Semester'),
      (3, '3rd Semester'),
      (4, '4th Semester'),
      (5, '5th Semester'),
      (6, '6th Semester'),
      (7, '7th Semester'),
      (8, '8th Semester')
  ) as seed(term_number, name)
  on conflict (curriculum_version_id, slug) do update
  set
    name = excluded.name,
    term_number = excluded.term_number,
    display_order = excluded.display_order,
    is_active = true;

  insert into public.subjects as existing (
    program_id,
    curriculum_version_id,
    term_id,
    name,
    slug,
    code,
    description,
    display_order,
    is_active
  )
  select
    bca_program_id,
    old_curriculum_id,
    terms.id,
    seed.name,
    public.slugify(
      'old bca semester ' || seed.term_number::text || ' ' ||
      seed.code || ' ' || seed.name
    ),
    seed.code,
    'Source: Tribhuvan University Bachelor of Arts in Computer Application '
      || '(BCA) 126-credit course structure supplied by Jana Bhawana Campus.'
      || case when seed.is_elective then ' Elective option.' else '' end,
    seed.display_order,
    true
  from (
    values
      (1, 'CACS101', 'Computer Fundamentals & Applications', 10, false),
      (1, 'CASO102', 'Society & Technology', 20, false),
      (1, 'CAEN103', 'English I', 30, false),
      (1, 'CAMT104', 'Mathematics I', 40, false),
      (1, 'CACS105', 'Digital Logic', 50, false),
      (2, 'CACS151', 'C Programming', 10, false),
      (2, 'CAAC152', 'Financial Accounting', 20, false),
      (2, 'CAEN153', 'English II', 30, false),
      (2, 'CAMT154', 'Mathematics II', 40, false),
      (2, 'CACS155', 'Microprocessor and Computer Architecture', 50, false),
      (3, 'CACS201', 'Data Structures & Algorithms', 10, false),
      (3, 'CAST202', 'Probability and Statistics', 20, false),
      (3, 'CACS203', 'System Analysis and Design', 30, false),
      (3, 'CACS204', 'OOP in Java', 40, false),
      (3, 'CACS205', 'Web Technology', 50, false),
      (4, 'CACS251', 'Operating Systems', 10, false),
      (4, 'CACS252', 'Numerical Methods', 20, false),
      (4, 'CACS253', 'Software Engineering', 30, false),
      (4, 'CACS254', 'Scripting Language', 40, false),
      (4, 'CACS255', 'Database Management System', 50, false),
      (4, 'CAPJ256', 'Project I', 60, false),
      (5, 'CACS301', 'MIS and e-Business', 10, false),
      (5, 'CACS302', 'DotNet Technology', 20, false),
      (5, 'CACS303', 'Computer Networking', 30, false),
      (5, 'CAMG304', 'Introduction to Management', 40, false),
      (5, 'CACS305', 'Computer Graphics and Animation', 50, false),
      (6, 'CACS351', 'Mobile Programming', 10, false),
      (6, 'CACS352', 'Distributed System', 20, false),
      (6, 'CAEC353', 'Applied Economics', 30, false),
      (6, 'CACS354', 'Advanced Java Programming', 40, false),
      (6, 'CACS355', 'Network Programming', 50, false),
      (6, 'CAPJ356', 'Project II', 60, false),
      (7, 'CACS401', 'Cyber Law & Professional Ethics', 10, false),
      (7, 'CACS402', 'Cloud Computing', 20, false),
      (7, 'CAIN403', 'Internships', 30, false),
      (8, 'CAOR451', 'Operations Research', 10, false),
      (8, 'CAPJ452', 'Project III', 20, false),
      (7, 'CAPS476', 'Applied Psychology', 100, true),
      (7, 'CACS477', 'Geographical Information System', 110, true),
      (7, 'CACS478', 'IT in Banking', 120, true),
      (7, 'CACS479', 'Hotel Information System', 130, true),
      (7, 'CAER480', 'Enterprise Resource Planning', 140, true),
      (7, 'CACS482', 'Knowledge Engineering', 150, true),
      (7, 'CACS483', 'Advanced DotNet Technology', 160, true),
      (7, 'CACS484', 'Database Programming', 170, true),
      (7, 'CACS485', 'Database Administration', 180, true),
      (7, 'CACS486', 'Network Administration', 190, true),
      (8, 'CAPS476', 'Applied Psychology', 100, true),
      (8, 'CACS477', 'Geographical Information System', 110, true),
      (8, 'CACS478', 'IT in Banking', 120, true),
      (8, 'CACS479', 'Hotel Information System', 130, true),
      (8, 'CAER480', 'Enterprise Resource Planning', 140, true),
      (8, 'CACS482', 'Knowledge Engineering', 150, true),
      (8, 'CACS483', 'Advanced DotNet Technology', 160, true),
      (8, 'CACS484', 'Database Programming', 170, true),
      (8, 'CACS485', 'Database Administration', 180, true),
      (8, 'CACS486', 'Network Administration', 190, true)
  ) as seed(term_number, code, name, display_order, is_elective)
  join public.terms
    on terms.curriculum_version_id = old_curriculum_id
   and terms.term_number = seed.term_number
  on conflict (term_id, slug) do update
  set
    name = excluded.name,
    code = excluded.code,
    description = excluded.description,
    display_order = excluded.display_order,
    is_active = true;
end
$$;

commit;
