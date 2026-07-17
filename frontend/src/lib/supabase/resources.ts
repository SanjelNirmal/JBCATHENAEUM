import { useEffect, useState } from "react";
import { publicEnvironment } from "../env";
import type { ResourceStatus } from "./database.types";
import type { ResourceFilters } from "./filters";
import { supabase } from "./client";
import { fetchAcademicCatalog } from "./academic";

export interface ResourceCard {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  academicYear: number | null;
  resourceType: string;
  programId: string;
  programName: string;
  facultyId: string;
  facultyName: string;
  termId: string;
  termName: string;
  subjectId: string;
  subjectName: string;
  categoryId: string;
  categoryName: string;
  contributorName: string;
  byteSize: number | null;
  pageCount: number | null;
  downloadCount: number;
  legacyUrl: string | null;
  createdAt: string;
}

export interface ResourcePage {
  items: ResourceCard[];
  total: number;
  page: number;
  pageSize: number;
}

interface SearchRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  academic_year: number | null;
  resource_type: string;
  program_id: string;
  program_name: string;
  faculty_id: string;
  faculty_name: string;
  term_id: string;
  term_name: string;
  subject_id: string;
  subject_name: string;
  category_id: string;
  category_name: string;
  contributor_name: string;
  legacy_url: string | null;
  byte_size: number | null;
  page_count: number | null;
  download_count: number;
  created_at: string;
  total_count: number;
}

function mapSearchRow(row: SearchRow): ResourceCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    academicYear: row.academic_year,
    resourceType: row.resource_type,
    programId: row.program_id,
    programName: row.program_name,
    facultyId: row.faculty_id,
    facultyName: row.faculty_name,
    termId: row.term_id,
    termName: row.term_name,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    contributorName: row.contributor_name,
    byteSize: row.byte_size,
    pageCount: row.page_count,
    legacyUrl: validateLegacyResourceUrl(row.legacy_url),
    downloadCount: row.download_count,
    createdAt: row.created_at,
  };
}

export async function searchResources(
  filters: ResourceFilters,
  signal?: AbortSignal,
): Promise<ResourcePage> {
  let request = supabase.rpc("search_public_resources", {
    search_query: filters.q || null,
    faculty_filter: filters.faculty ?? null,
    program_filter: filters.program ?? null,
    term_filter: filters.term ?? null,
    subject_filter: filters.subject ?? null,
    category_filter: filters.category ?? null,
    academic_year_filter: filters.year ?? null,
    uploaded_from: filters.from ?? null,
    uploaded_to: filters.to ?? null,
    sort_by: filters.sort,
    page_number: filters.page,
    page_size: filters.pageSize,
  });
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  const rows = (data ?? []) as SearchRow[];
  return {
    items: rows.map(mapSearchRow),
    total: Number(rows[0]?.total_count ?? 0),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function fetchResource(
  resourceIdOrSlug: string,
): Promise<ResourceCard | null> {
  const lookup = resourceIdOrSlug.trim();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      lookup,
    );
  const isSlug =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lookup) && lookup.length <= 180;
  if (!isUuid && !isSlug) return null;
  const { data: resource, error } = await supabase
    .from("resources")
    .select(
      "id,title,slug,description,academic_year,resource_type,program_id,term_id,subject_id,category_id,owner_id,download_count,created_at,current_version_id,file_url",
    )
    .or(`id.eq.${lookup},slug.eq.${lookup}`)
    .maybeSingle();
  if (error) throw error;
  if (!resource) return null;
  const [catalog, profileResult, versionResult] = await Promise.all([
    fetchAcademicCatalog(),
    resource.owner_id
      ? supabase
          .from("profiles")
          .select("name")
          .eq("id", resource.owner_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    resource.current_version_id
      ? supabase
          .from("resource_versions")
          .select("byte_size,page_count")
          .eq("id", resource.current_version_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const academic = catalog.find(
    (item) => item.subjectId === resource.subject_id,
  );
  if (!academic) return null;
  const category = academic.categories.find(
    (item) => item.id === resource.category_id,
  );
  return {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    description: resource.description,
    academicYear: resource.academic_year,
    resourceType: resource.resource_type,
    programId: academic.programId,
    programName: academic.programName,
    facultyId: academic.facultyId,
    facultyName: academic.facultyName,
    termId: academic.termId,
    termName: academic.termName,
    subjectId: academic.subjectId,
    subjectName: academic.subjectName,
    categoryId: resource.category_id,
    categoryName: category?.name ?? "Resource",
    contributorName: profileResult.data?.name ?? "Contributor",
    byteSize: versionResult.data?.byte_size ?? null,
    pageCount: versionResult.data?.page_count ?? null,
    legacyUrl: validateLegacyResourceUrl(resource.file_url),
    downloadCount: resource.download_count,
    createdAt: resource.created_at,
  };
}

export async function fetchPublicStats(): Promise<{
  publishedResources: number;
  programs: number;
  subjects: number;
  downloads: number;
}> {
  const { data, error } = await supabase.rpc("public_platform_stats");
  if (error) throw error;
  const value = data as Record<string, number>;
  return {
    publishedResources: value.publishedResources ?? 0,
    programs: value.programs ?? 0,
    subjects: value.subjects ?? 0,
    downloads: value.downloads ?? 0,
  };
}

export function getPublicResourceAccessUrl(resourceId: string): string {
  return `${publicEnvironment.config.supabaseUrl}/functions/v1/resource-download?resourceId=${encodeURIComponent(resourceId)}`;
}

export function validateLegacyResourceUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !["drive.google.com", "docs.google.com"].includes(url.hostname)
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getLegacyPreviewUrl(value: string): string {
  const url = new URL(value);
  if (url.hostname === "drive.google.com")
    return url.toString().replace(/\/view(?:\?.*)?$/, "/preview");
  return url.toString();
}

export function getDownloadUrl(resourceId: string): string {
  return `${getPublicResourceAccessUrl(resourceId)}&download=1`;
}

export async function getAdminResourcePreviewUrl(
  resourceId: string,
): Promise<string> {
  const { data: version, error: versionError } = await supabase
    .from("resource_versions")
    .select("id")
    .eq("resource_id", resourceId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) throw versionError;
  if (!version) throw new Error("not_found");
  const { data, error } = await supabase.functions.invoke(
    "review-resource-file",
    { body: { versionId: version.id } },
  );
  if (error) throw error;
  if (!data?.signedUrl) throw new Error("not_available");
  return String(data.signedUrl);
}

export async function reportResource(
  resourceId: string,
  reason: string,
  details: string,
) {
  const { error } = await supabase.rpc("submit_resource_report", {
    target_resource_id: resourceId,
    report_reason: reason,
    report_details: details || null,
  });
  if (error) throw error;
}

export interface AdminResourceRow {
  id: string;
  title: string;
  status: ResourceStatus;
  createdAt: string;
  program: string;
  term: string;
  subject: string;
  ownerId: string | null;
}

export interface AdminResourceFilters {
  status?: ResourceStatus;
  programId?: string;
  termId?: string;
  subjectId?: string;
  contributorId?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: "recent" | "oldest" | "title" | "popular";
}

export async function fetchAdminResources(
  page: number,
  pageSize: number,
  search: string,
  filters: AdminResourceFilters = {},
) {
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("resources")
    .select(
      "id,title,status,created_at,program_id,term_id,subject_id,owner_id,download_count",
      { count: "exact" },
    )
    .range(from, from + pageSize - 1);
  if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.programId) query = query.eq("program_id", filters.programId);
  if (filters.termId) query = query.eq("term_id", filters.termId);
  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
  if (filters.contributorId)
    query = query.eq("owner_id", filters.contributorId);
  if (filters.createdFrom) query = query.gte("created_at", filters.createdFrom);
  if (filters.createdTo) query = query.lt("created_at", filters.createdTo);
  query =
    filters.sort === "title"
      ? query.order("title")
      : filters.sort === "popular"
        ? query
            .order("download_count", { ascending: false })
            .order("created_at", { ascending: false })
        : query.order("created_at", { ascending: filters.sort === "oldest" });
  const [{ data, count, error }, catalog] = await Promise.all([
    query,
    fetchAcademicCatalog(),
  ]);
  if (error) throw error;
  return {
    items: (data ?? []).map((item): AdminResourceRow => {
      const academic = catalog.find(
        (option) => option.subjectId === item.subject_id,
      );
      return {
        id: item.id,
        title: item.title,
        status: item.status as ResourceStatus,
        createdAt: item.created_at,
        program: academic?.programName ?? "—",
        term: academic?.termName ?? "—",
        subject: academic?.subjectName ?? "—",
        ownerId: item.owner_id,
      };
    }),
    total: count ?? 0,
  };
}

export async function archiveResource(id: string) {
  const { error } = await supabase.rpc("archive_resource", {
    target_resource_id: id,
  });
  if (error) throw error;
}
export const deleteResource = archiveResource;
export async function restoreResource(id: string) {
  const { error } = await supabase.rpc("restore_resource", {
    target_resource_id: id,
  });
  if (error) throw error;
}
export async function bulkResourceState(
  ids: string[],
  action: "archive" | "restore",
  reason: string,
) {
  const { data, error } = await supabase.rpc("bulk_resource_state", {
    target_resource_ids: ids,
    requested_action: action,
    supplied_reason: reason,
  });
  if (error) throw error;
  return data;
}
export async function updateResourceMetadata(
  id: string,
  title: string,
  description: string,
  categoryId: string,
  academicYear: number,
) {
  const { error } = await supabase.rpc("update_resource_metadata", {
    target_resource_id: id,
    next_title: title,
    next_description: description,
    next_category_id: categoryId,
    next_academic_year: academicYear,
  });
  if (error) throw error;
}
export async function permanentlyDeleteResource(
  id: string,
  confirmation: string,
) {
  const { data, error } = await supabase.functions.invoke(
    "permanently-delete-resource",
    { body: { resourceId: id, confirmation } },
  );
  if (error) throw error;
  return data as { status: "deleted"; cleanupPending: boolean };
}
export async function fetchResourceHistory(id: string) {
  const { data, error } = await supabase
    .from("resource_versions")
    .select(
      "id,version_number,mime_type,byte_size,page_count,scan_status,is_current,created_at",
    )
    .eq("resource_id", id)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface Resource {
  id: string;
  program_id: string;
  term_id: string;
  subject_id: string;
  title: string;
  subject: string;
  faculty: string;
  semester: string;
  author_name: string;
  file_url: string | null;
  file_size: string | null;
  resource_type: string;
  created_at: string;
}
export interface Note {
  id: string;
  title: string;
  author: string;
  date: string;
  size: string;
  url: string;
  totalPages: number;
}
export interface Subject {
  id: string;
  faculty: string;
  semester: string;
  name: string;
  notes: Note[];
}

export function useResourcesData() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = async () => {
    setLoading(true);
    try {
      const page = await searchResources({
        q: "",
        sort: "recent",
        page: 1,
        pageSize: 50,
      });
      const mapped = page.items.map((item): Resource => ({
        id: item.id,
        program_id: item.programId,
        term_id: item.termId,
        subject_id: item.subjectId,
        title: item.title,
        subject: item.subjectName,
        faculty: item.programName,
        semester: item.termName,
        author_name: item.contributorName,
        file_url: null,
        file_size: item.byteSize
          ? `${(item.byteSize / 1_048_576).toFixed(1)} MB`
          : null,
        resource_type: item.resourceType,
        created_at: item.createdAt,
      }));
      const groups = new Map<string, Subject>();
      for (const item of page.items) {
        const group = groups.get(item.subjectId) ?? {
          id: item.subjectId,
          faculty: item.programName,
          semester: item.termName,
          name: item.subjectName,
          notes: [],
        };
        group.notes.push({
          id: item.id,
          title: item.title,
          author: item.contributorName,
          date: item.createdAt,
          size: item.byteSize
            ? `${(item.byteSize / 1_048_576).toFixed(1)} MB`
            : "Unknown",
          url: getPublicResourceAccessUrl(item.id),
          totalPages: item.pageCount ?? 0,
        });
        groups.set(item.subjectId, group);
      }
      setResources(mapped);
      setSubjects([...groups.values()]);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Resources could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  return {
    resources,
    subjects,
    loading,
    error,
    refresh,
    getSubjectById: (id: string) =>
      subjects.find((subject) => subject.id === id),
    toggleMockData: () => undefined,
  };
}
