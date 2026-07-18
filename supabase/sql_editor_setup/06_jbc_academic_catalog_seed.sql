-- JBC ATHENAEUM academic catalog seed.
--
-- Phase 2 deliberately backfilled only labels that already existed on legacy
-- resources. This data-preserving migration expands the contribution catalog
-- with course structures published by Tribhuvan University and Jana Bhawana
-- Campus. Existing program/curriculum/term rows are reused so resource foreign
-- keys remain valid.

begin;

do $$
declare
  campus_id_value uuid;
  program_id_value uuid;
  curriculum_id_value uuid;
  program_record record;
begin
  select id
  into campus_id_value
  from public.campuses
  where slug = 'jana-bhawana-campus';

  if campus_id_value is null then
    raise exception 'Jana Bhawana Campus must exist before seeding its academic catalog';
  end if;

  insert into public.faculties as existing (
    campus_id, name, slug, code, description, display_order, is_active
  )
  values
    (
      campus_id_value,
      'Faculty of Humanities and Social Sciences',
      'humanities-and-social-sciences',
      'FOHSS',
      'Tribhuvan University faculty responsible for the BCA program.',
      10,
      true
    ),
    (
      campus_id_value,
      'Faculty of Education',
      'education',
      'FOE',
      'Tribhuvan University faculty responsible for the BICTE program.',
      20,
      true
    ),
    (
      campus_id_value,
      'Faculty of Management',
      'management',
      'FOM',
      'Tribhuvan University faculty responsible for the BBS and MBS programs.',
      30,
      true
    )
  on conflict (campus_id, slug) do update
  set
    name = excluded.name,
    code = excluded.code,
    description = coalesce(existing.description, excluded.description),
    display_order = excluded.display_order,
    is_active = true;

  insert into public.programs as existing (
    campus_id, faculty_id, name, slug, code, description, display_order, is_active
  )
  select
    campus_id_value,
    faculties.id,
    seed.name,
    seed.slug,
    seed.code,
    seed.description,
    seed.display_order,
    true
  from (
    values
      (
        'BCA',
        'bca',
        'BCA',
        'humanities-and-social-sciences',
        'Bachelor of Computer Applications.',
        10
      ),
      (
        'BICTE',
        'bicte',
        'BICTE',
        'education',
        'Bachelor of Information Communication Technology Education.',
        20
      ),
      (
        'BBS',
        'bbs',
        'BBS',
        'management',
        'Bachelor of Business Studies.',
        30
      ),
      (
        'MBS',
        'mbs',
        'MBS',
        'management',
        'Master of Business Studies.',
        40
      )
  ) as seed(name, slug, code, faculty_slug, description, display_order)
  join public.faculties
    on faculties.campus_id = campus_id_value
   and faculties.slug = seed.faculty_slug
  on conflict (campus_id, slug) do update
  set
    faculty_id = excluded.faculty_id,
    name = excluded.name,
    code = excluded.code,
    description = coalesce(existing.description, excluded.description),
    display_order = excluded.display_order,
    is_active = true;

  for program_record in
    select *
    from (
      values
        ('bca', 'Current BCA Curriculum', 2025),
        ('bicte', 'Jana Bhawana Campus Published BICTE Curriculum', null::integer),
        ('bbs', 'Jana Bhawana Campus Published BBS Curriculum', null::integer),
        ('mbs', 'Jana Bhawana Campus Published MBS Curriculum', null::integer)
    ) as seed(program_slug, curriculum_name, effective_year)
  loop
    select id
    into program_id_value
    from public.programs
    where campus_id = campus_id_value
      and slug = program_record.program_slug;

    select id
    into curriculum_id_value
    from public.curriculum_versions
    where program_id = program_id_value
      and is_current
    order by is_active desc, created_at
    limit 1;

    if curriculum_id_value is null then
      insert into public.curriculum_versions (
        program_id, name, slug, effective_year, is_current, display_order, is_active
      )
      values (
        program_id_value,
        program_record.curriculum_name,
        'catalog-current',
        program_record.effective_year,
        true,
        10,
        true
      )
      on conflict (program_id, slug) do update
      set
        name = excluded.name,
        effective_year = excluded.effective_year,
        is_current = true,
        is_active = true
      returning id into curriculum_id_value;
    else
      -- Keep the name/year of a legacy curriculum that already owns resources.
      -- Renaming it as a specific syllabus version could mislabel old uploads.
      update public.curriculum_versions
      set
        is_active = true,
        display_order = least(display_order, 10)
      where id = curriculum_id_value;
    end if;

    if program_record.program_slug in ('bca', 'bicte') then
      insert into public.terms (
        program_id, curriculum_version_id, name, slug,
        term_number, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
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
    elsif program_record.program_slug = 'bbs' then
      insert into public.terms (
        program_id, curriculum_version_id, name, slug,
        term_number, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
        seed.name,
        public.slugify(seed.name),
        seed.term_number,
        seed.term_number,
        true
      from (
        values
          (1, '1st Year'),
          (2, '2nd Year'),
          (3, '3rd Year'),
          (4, '4th Year')
      ) as seed(term_number, name)
      on conflict (curriculum_version_id, slug) do update
      set
        name = excluded.name,
        term_number = excluded.term_number,
        display_order = excluded.display_order,
        is_active = true;
    else
      insert into public.terms (
        program_id, curriculum_version_id, name, slug,
        term_number, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
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
          (4, '4th Semester')
      ) as seed(term_number, name)
      on conflict (curriculum_version_id, slug) do update
      set
        name = excluded.name,
        term_number = excluded.term_number,
        display_order = excluded.display_order,
        is_active = true;
    end if;

    if program_record.program_slug = 'bca' then
      insert into public.subjects as existing (
        program_id, curriculum_version_id, term_id, name, slug, code,
        description, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
        terms.id,
        seed.name,
        public.slugify(seed.name),
        seed.code,
        'Catalog source: Tribhuvan University BCA Course Structure (2025).'
          || case when seed.is_elective then ' Elective option.' else '' end,
        seed.display_order,
        true
      from (
        values
          (1, 'BCA 101', 'Computer Fundamentals and Applications', 10, false),
          (1, 'BCA 102', 'Programming in C', 20, false),
          (1, 'BCA 103', 'Digital Logic', 30, false),
          (1, 'BCA 104', 'Mathematics-I', 40, false),
          (1, 'BCA 105', 'Professional Communication and Ethics', 50, false),
          (1, 'BCA 106', 'Hardware Workshop', 60, false),
          (2, 'BCA 151', 'Discrete Structure', 10, false),
          (2, 'BCA 152', 'Microprocessor and Computer Architecture', 20, false),
          (2, 'BCA 153', 'OOP in Java', 30, false),
          (2, 'BCA 154', 'Mathematics-II', 40, false),
          (2, 'BCA 155', 'UX/UI Design', 50, false),
          (2, 'BCA 156', 'Principles of Management', 60, false),
          (3, 'BCA 201', 'Data Structure and Algorithms', 10, false),
          (3, 'BCA 202', 'Database Management System', 20, false),
          (3, 'BCA 203', 'Web Technology-I', 30, false),
          (3, 'BCA 204', 'System Analysis and Design', 40, false),
          (3, 'BCA 205', 'Probability and Statistics', 50, false),
          (3, 'BCA 206', 'Applied Economics', 60, false),
          (4, 'BCA 251', 'Operating Systems', 10, false),
          (4, 'BCA 252', 'Software Engineering', 20, false),
          (4, 'BCA 253', 'Numerical Methods', 30, false),
          (4, 'BCA 254', 'Python Programming', 40, false),
          (4, 'BCA 255', 'Web Technology-II', 50, false),
          (4, 'BCA 256', 'Project-I', 60, false),
          (5, 'BCA 301', 'Computer Network', 10, false),
          (5, 'BCA 302', 'Artificial Intelligence', 20, false),
          (5, 'BCA 303', 'Advance Java Programming', 30, false),
          (5, 'BCA 304', 'MIS and e-Business', 40, false),
          (5, 'BCA 305', 'Society and Technology', 50, false),
          (5, 'BCA 306', 'Project-II', 60, false),
          (6, 'BCA 351', 'Computer Graphics and Animation', 10, false),
          (6, 'BCA 352', 'Mobile Programming', 20, false),
          (6, 'BCA 353', 'Cryptography and Network Security', 30, false),
          (6, 'BCA 354', 'Technical Writing', 40, false),
          (6, 'BCA 355', 'Distributed System', 50, false),
          (6, 'BCA 356', 'Project-III', 60, false),
          (7, 'BCA 401', 'Cyber Security and Ethical Hacking', 10, false),
          (7, 'BCA 402', 'Software Project Management', 20, false),
          (7, 'BCA 403', 'Financial Accounting', 30, false),
          (7, 'BCA 404', 'Project-IV', 40, false),
          (7, 'BCA 404-I', 'Machine Learning', 50, true),
          (7, 'BCA 404-II', 'E-Commerce', 60, true),
          (7, 'BCA 404-III', 'Database Administration', 70, true),
          (7, 'BCA 404-IV', 'Linux', 80, true),
          (7, 'BCA 405-I', 'Dotnet Technology', 90, true),
          (7, 'BCA 405-II', 'Business Intelligence', 100, true),
          (7, 'BCA 405-III', 'Software Testing and Quality Assurance', 110, true),
          (7, 'BCA 405-IV', 'Data Visualization', 120, true),
          (8, 'BCA 451', 'Cloud Computing', 10, false),
          (8, 'BCA 452', 'Internship', 20, false),
          (8, 'BCA 453-I', 'Network Administration', 30, true),
          (8, 'BCA 453-II', 'E-Governance', 40, true),
          (8, 'BCA 453-III', 'Database Programming', 50, true),
          (8, 'BCA 453-IV', 'Geographical Information System', 60, true),
          (8, 'BCA 454-I', 'Digital Marketing and SEO', 70, true),
          (8, 'BCA 454-II', 'Image Processing', 80, true),
          (8, 'BCA 454-III', 'Internet of Things', 90, true),
          (8, 'BCA 454-IV', 'Data Mining and Data Warehouse', 100, true)
      ) as seed(term_number, code, name, display_order, is_elective)
      join public.terms
        on terms.curriculum_version_id = curriculum_id_value
       and terms.term_number = seed.term_number
      on conflict (term_id, slug) do update
      set
        name = excluded.name,
        code = excluded.code,
        description = coalesce(existing.description, excluded.description),
        display_order = excluded.display_order,
        is_active = true;
    elsif program_record.program_slug = 'bicte' then
      insert into public.subjects as existing (
        program_id, curriculum_version_id, term_id, name, slug, code,
        description, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
        terms.id,
        seed.name,
        public.slugify(seed.name),
        null,
        'Catalog source: Jana Bhawana Campus BICTE course structure.',
        seed.display_order,
        true
      from (
        values
          (1, 'English Language-I', 10),
          (1, 'General Nepali-I', 20),
          (1, 'Fundamental of Education', 30),
          (1, 'Mathematics-I', 40),
          (1, 'Introduction to Information Technology', 50),
          (1, 'Programming Concept with C', 60),
          (2, 'English Language-II', 10),
          (2, 'General Nepali-II', 20),
          (2, 'Development Psychology', 30),
          (2, 'Mathematics-II', 40),
          (2, 'Introduction to Information Technology', 50),
          (2, 'Object Oriented Programming with C++', 60),
          (3, 'Learning Psychology', 10),
          (3, 'Data Structure and Algorithm', 20),
          (3, 'Computer Architecture and Organization', 30),
          (3, 'Web Technology', 40),
          (3, 'Probability and Statistics', 50),
          (3, '21st Century Life Skills', 60),
          (4, 'Fundamental of Curriculum', 10),
          (4, 'Operating System', 20),
          (4, 'Database Management System', 30),
          (4, 'System Analysis and Design', 40),
          (4, 'Numerical Analysis', 50),
          (4, 'Leadership and Management', 60),
          (5, 'Assessment in Teaching and Learning', 10),
          (5, 'Java Programming Language', 20),
          (5, 'Data Communication and Networks', 30),
          (5, 'Software Engineering and Project Management', 40),
          (5, 'Discrete Mathematics', 50),
          (6, 'Research Methods in Education', 10),
          (6, 'Visual Programming (.NET)', 20),
          (6, 'Computer Graphics', 30),
          (6, 'Digital Pedagogy', 40),
          (6, 'Network and Information Security', 50),
          (7, 'Research Project', 10),
          (7, 'Artificial Intelligence in Education', 20),
          (7, 'Teaching Methods for ICT', 30),
          (7, 'Geographical Information System (GIS)', 40),
          (7, 'Big Data Analysis', 50),
          (7, 'Capstone Project', 60),
          (8, 'Classroom Pedagogy', 10),
          (8, 'System Administration with Linux', 20),
          (8, 'Python Programming', 30),
          (8, 'Cloud Computing', 40),
          (8, 'Multimedia Technology', 50),
          (8, 'Teaching Practicum in ICT', 60)
      ) as seed(term_number, name, display_order)
      join public.terms
        on terms.curriculum_version_id = curriculum_id_value
       and terms.term_number = seed.term_number
      on conflict (term_id, slug) do update
      set
        name = excluded.name,
        description = coalesce(existing.description, excluded.description),
        display_order = excluded.display_order,
        is_active = true;
    elsif program_record.program_slug = 'bbs' then
      insert into public.subjects as existing (
        program_id, curriculum_version_id, term_id, name, slug, code,
        description, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
        terms.id,
        seed.name,
        public.slugify(seed.name),
        seed.code,
        'Catalog source: Jana Bhawana Campus BBS course structure.',
        seed.display_order,
        true
      from (
        values
          (1, '201', 'Business English', 10),
          (1, '203', 'Business Economics', 20),
          (1, '202', 'Business Statistics', 30),
          (1, '213', 'Principles of Management', 40),
          (1, '211', 'Accountancy', 50),
          (2, '205', 'Business English', 10),
          (2, '206', 'Economics', 20),
          (2, '212', 'Accountancy', 30),
          (2, '214', 'Marketing', 40),
          (2, '216', 'Human Resource Management', 50),
          (3, '218', 'Fundamentals of Taxation and Auditing', 10),
          (3, '215', 'Fundamentals of Financial Management', 20),
          (3, '204', 'Business Law', 30),
          (3, '217', 'Business Environment and Strategic Management', 40),
          (3, '219', 'Organizational Behaviour', 50),
          (4, '220', 'Entrepreneurship Development', 10),
          (4, '250', 'Fundamentals of Corporate Finance', 20),
          (4, '251', 'Commercial Bank Management', 30),
          (4, '253', 'Fundamentals of Investment', 40),
          (4, '221', 'Business Research Methods', 50),
          (4, '401', 'Final Project', 60)
      ) as seed(term_number, code, name, display_order)
      join public.terms
        on terms.curriculum_version_id = curriculum_id_value
       and terms.term_number = seed.term_number
      on conflict (term_id, slug) do update
      set
        name = excluded.name,
        code = excluded.code,
        description = coalesce(existing.description, excluded.description),
        display_order = excluded.display_order,
        is_active = true;
    else
      insert into public.subjects as existing (
        program_id, curriculum_version_id, term_id, name, slug, code,
        description, display_order, is_active
      )
      select
        program_id_value,
        curriculum_id_value,
        terms.id,
        seed.name,
        public.slugify(seed.name),
        seed.code,
        'Catalog source: Jana Bhawana Campus MBS semester course structure.',
        seed.display_order,
        true
      from (
        values
          (1, 'MKT 511', 'Marketing Management', 10),
          (1, 'ECO 512', 'Managerial Economics', 20),
          (1, 'MSC 514', 'Statistical Methods', 30),
          (1, 'MGT 515', 'Organizational Behavior', 40),
          (1, 'MGT 519', 'Managerial Communication', 50),
          (2, 'FIN 510', 'Financial Management', 10),
          (2, 'MGT 513', 'Human Resource Management', 20),
          (2, 'MSC 516', 'Production and Operations Management', 30),
          (2, 'ACC 517', 'Management Accountancy', 40),
          (2, 'MGT 518', 'Business Environment', 50),
          (3, 'ACC 519', 'Accounting for Financial and Managerial Decision and Control', 10),
          (3, 'MSC 521', 'Research Methodology', 20),
          (3, 'MGT 522', 'International Business', 30),
          (3, 'MGT 524', 'Entrepreneurship', 40),
          (3, 'FIN 688', 'Corporate Finance', 50),
          (4, 'MGT 523', 'Strategic Management', 10),
          (4, 'FIN 685', 'Financial Markets and Institutions', 20),
          (4, 'FIN 689', 'Investment Management', 30),
          (4, 'MGT 690', 'Dissertation', 40)
      ) as seed(term_number, code, name, display_order)
      join public.terms
        on terms.curriculum_version_id = curriculum_id_value
       and terms.term_number = seed.term_number
      on conflict (term_id, slug) do update
      set
        name = excluded.name,
        code = excluded.code,
        description = coalesce(existing.description, excluded.description),
        display_order = excluded.display_order,
        is_active = true;
    end if;
  end loop;
end
$$;

do $$
begin
  if exists (
    select 1
    from public.programs
    join public.campuses on campuses.id = programs.campus_id
    where campuses.slug = 'jana-bhawana-campus'
      and programs.slug in ('bca', 'bicte', 'bbs', 'mbs')
    group by programs.slug
    having count(*) > 1
  ) then
    raise exception 'Academic catalog seed created duplicate program slugs';
  end if;

  if (
    select count(*)
    from public.terms
    join public.curriculum_versions
      on curriculum_versions.id = terms.curriculum_version_id
     and curriculum_versions.is_current
    join public.programs on programs.id = terms.program_id
    join public.campuses on campuses.id = programs.campus_id
    where campuses.slug = 'jana-bhawana-campus'
      and programs.slug = 'bca'
      and terms.term_number between 1 and 8
  ) <> 8 then
    raise exception 'BCA catalog seed did not create all eight semesters';
  end if;
end
$$;

commit;
