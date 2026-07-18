import { supabase } from "./client";

export interface AcademicSubjectOption {
  campusId: string;
  campusName: string;
  campusSlug: string;
  facultyId: string;
  facultyName: string;
  facultySlug: string;
  programId: string;
  programName: string;
  programSlug: string;
  curriculumVersionId: string;
  curriculumName: string;
  curriculumIsCurrent: boolean;
  termId: string;
  termName: string;
  termSlug: string;
  subjectId: string;
  subjectCode: string | null;
  subjectName: string;
  subjectSlug: string;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export async function fetchAcademicCatalog(): Promise<AcademicSubjectOption[]> {
  const [
    campuses,
    faculties,
    programs,
    curricula,
    terms,
    subjects,
    categories,
  ] = await Promise.all([
    supabase
      .from("campuses")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("faculties")
      .select("id,campus_id,name,slug")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("programs")
      .select("id,campus_id,faculty_id,name,slug,display_order")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("curriculum_versions")
      .select("id,program_id,name,is_current")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("terms")
      .select("id,program_id,curriculum_version_id,name,slug,display_order")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("subjects")
      .select(
        "id,program_id,curriculum_version_id,term_id,name,slug,code,display_order",
      )
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("resource_categories")
      .select("id,campus_id,name,slug,display_order")
      .eq("is_active", true)
      .order("display_order"),
  ]);
  const error = [
    campuses,
    faculties,
    programs,
    curricula,
    terms,
    subjects,
    categories,
  ]
    .map((result) => result.error)
    .find(Boolean);
  if (error) throw error;

  const programOrder = new Map(
    (programs.data ?? []).map((item) => [item.id, item.display_order]),
  );
  const termOrder = new Map(
    (terms.data ?? []).map((item) => [item.id, item.display_order]),
  );
  const curriculumOrder = new Map(
    (curricula.data ?? []).map((item, index) => [item.id, index]),
  );
  const subjectOrder = new Map(
    (subjects.data ?? []).map((item) => [item.id, item.display_order]),
  );

  const catalog = (subjects.data ?? []).flatMap((subject) => {
    const program = (programs.data ?? []).find(
      (item) => item.id === subject.program_id,
    );
    const faculty = (faculties.data ?? []).find(
      (item) => item.id === program?.faculty_id,
    );
    const curriculum = (curricula.data ?? []).find(
      (item) => item.id === subject.curriculum_version_id,
    );
    const term = (terms.data ?? []).find((item) => item.id === subject.term_id);
    const campus = (campuses.data ?? []).find(
      (item) => item.id === program?.campus_id,
    );
    if (!program || !faculty || !curriculum || !term || !campus) return [];
    return [
      {
        campusId: campus.id,
        campusName: campus.name,
        campusSlug: campus.slug,
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultySlug: faculty.slug,
        programId: program.id,
        programName: program.name,
        programSlug: program.slug,
        curriculumVersionId: curriculum.id,
        curriculumName: curriculum.name,
        curriculumIsCurrent: curriculum.is_current,
        termId: term.id,
        termName: term.name,
        termSlug: term.slug,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        subjectSlug: subject.slug,
        categories: (categories.data ?? [])
          .filter((item) => item.campus_id === campus.id)
          .map((item) => ({ id: item.id, name: item.name, slug: item.slug })),
      },
    ];
  });

  return catalog.sort(
    (left, right) =>
      (programOrder.get(left.programId) ?? 0) -
        (programOrder.get(right.programId) ?? 0) ||
      (curriculumOrder.get(left.curriculumVersionId) ?? 0) -
        (curriculumOrder.get(right.curriculumVersionId) ?? 0) ||
      (termOrder.get(left.termId) ?? 0) - (termOrder.get(right.termId) ?? 0) ||
      (subjectOrder.get(left.subjectId) ?? 0) -
        (subjectOrder.get(right.subjectId) ?? 0) ||
      left.subjectName.localeCompare(right.subjectName),
  );
}

export async function findSubjectBySlug(slug: string) {
  const catalog = await fetchAcademicCatalog();
  return catalog.find((item) => item.subjectSlug === slug) ?? null;
}

export async function findProgramBySlug(slug: string) {
  const catalog = await fetchAcademicCatalog();
  return catalog.find((item) => item.programSlug === slug) ?? null;
}

export async function findFacultyBySlug(slug: string) {
  const catalog = await fetchAcademicCatalog();
  return catalog.find((item) => item.facultySlug === slug) ?? null;
}
