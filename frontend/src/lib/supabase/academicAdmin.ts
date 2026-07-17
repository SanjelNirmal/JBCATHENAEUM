import { supabase } from "./client";

export type AcademicKind =
  | "campuses"
  | "faculties"
  | "programs"
  | "curriculum_versions"
  | "terms"
  | "subjects"
  | "resource_categories";
export interface AcademicAdminData {
  campuses: Array<Record<string, unknown>>;
  faculties: Array<Record<string, unknown>>;
  programs: Array<Record<string, unknown>>;
  curriculum_versions: Array<Record<string, unknown>>;
  terms: Array<Record<string, unknown>>;
  subjects: Array<Record<string, unknown>>;
  resource_categories: Array<Record<string, unknown>>;
}

const academicColumns: Record<AcademicKind, string> = {
  campuses: "id,name,slug,is_active,display_order",
  faculties: "id,campus_id,name,slug,is_active,display_order",
  programs: "id,campus_id,faculty_id,name,slug,code,is_active,display_order",
  curriculum_versions:
    "id,program_id,name,slug,effective_year,is_current,is_active,display_order",
  terms:
    "id,program_id,curriculum_version_id,name,slug,term_number,is_active,display_order",
  subjects:
    "id,program_id,curriculum_version_id,term_id,name,slug,is_active,display_order",
  resource_categories: "id,campus_id,name,slug,is_active,display_order",
};

export async function fetchAcademicAdminData(): Promise<AcademicAdminData> {
  const kinds: AcademicKind[] = [
    "campuses",
    "faculties",
    "programs",
    "curriculum_versions",
    "terms",
    "subjects",
    "resource_categories",
  ];
  const results = await Promise.all(
    kinds.map((kind) =>
      supabase.from(kind).select(academicColumns[kind]).order("display_order"),
    ),
  );
  const error = results.map((result) => result.error).find(Boolean);
  if (error) throw error;
  return Object.fromEntries(
    kinds.map((kind, index) => [kind, results[index].data ?? []]),
  ) as unknown as AcademicAdminData;
}

export async function createAcademicEntity(
  kind: AcademicKind,
  values: Record<string, unknown>,
) {
  const { error } = await supabase.from(kind).insert(values);
  if (error) throw error;
}

export async function setAcademicEntityActive(
  kind: AcademicKind,
  id: string,
  active: boolean,
) {
  const { error } = await supabase
    .from(kind)
    .update({ is_active: active })
    .eq("id", id);
  if (error) throw error;
}

export function slugifyValue(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}
