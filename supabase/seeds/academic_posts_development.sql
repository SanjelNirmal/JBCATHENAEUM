-- Optional development-only academic post seed.
-- Drive URLs intentionally remain NULL. Do not run this file in production
-- unless these sample records are wanted.

with seed(title, slug, excerpt, body, program_slug, category_slug, published_at) as (
  values
    (
      'BCA 4th Semester DBMS Complete Notes',
      'bca-4th-semester-dbms-complete-notes',
      'A structured collection of database concepts, SQL examples, normalization notes, and revision material.',
      E'# Database Management Systems\n\nStudy relational modelling, SQL, normalization, transactions, and database security with this structured campus guide.',
      'bca',
      'notes',
      now() - interval '1 day'
    ),
    (
      'Admission Open 2083',
      'admission-open-2083',
      'Important admission dates, eligibility guidance, and required documents for Jana Bhawana Campus applicants.',
      E'# Admission Open 2083\n\nReview eligibility, application dates, entrance guidance, and the documents required for admission.',
      null,
      'admission',
      now() - interval '2 days'
    ),
    (
      'Operating System Lab Manual',
      'operating-system-lab-manual',
      'Practical exercises covering Linux commands, processes, memory management, and file systems.',
      E'# Operating System Laboratory\n\nThis manual introduces shell commands, process scheduling, memory allocation, and file-system exercises.',
      'bca',
      'practical-files',
      now() - interval '3 days'
    ),
    (
      'BICTE Teaching Practice Materials',
      'bicte-teaching-practice-materials',
      'Lesson-plan templates, observation formats, reflective journals, and assessment examples.',
      E'# Teaching Practice\n\nUse these templates to plan lessons, record observations, reflect on practice, and prepare assessments.',
      'bicte',
      'assignments',
      now() - interval '4 days'
    )
)
insert into public.academic_posts(
  title,
  slug,
  excerpt,
  body,
  program_id,
  category_id,
  author_name,
  drive_url,
  resource_count,
  reading_time_minutes,
  status,
  published_at
)
select
  seed.title,
  seed.slug,
  seed.excerpt,
  seed.body,
  programs.id,
  categories.id,
  'JBC Academic Resource Team',
  null,
  0,
  greatest(1, ceil(length(seed.body) / 900.0)::integer),
  'published'::public.academic_post_status,
  seed.published_at
from seed
join public.academic_post_categories as categories
  on categories.slug = seed.category_slug
left join public.programs
  on programs.slug = seed.program_slug
on conflict ((lower(slug))) do nothing;
