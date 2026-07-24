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
  abstract: string | null;
  academicYear: number | null;
  resourceType: string;
  programId: string;
  programName: string;
  curriculumVersionId?: string;
  curriculumName?: string;
  facultyId: string;
  facultyName: string;
  termId: string;
  termName: string;
  subjectId: string;
  subjectCode?: string | null;
  subjectName: string;
  categoryId: string;
  categoryName: string;
  contributorId: string | null;
  contributorName: string;
  byteSize: number | null;
  pageCount: number | null;
  downloadCount: number;
  legacyUrl: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  verificationLevel: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  moderationNotes: string | null;
  reviewedAt: string | null;
  topicsCovered: string[];
  learningOutcomes: string[];
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
  abstract: string | null;
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
  contributor_id: string | null;
  contributor_name: string;
  legacy_url: string | null;
  byte_size: number | null;
  page_count: number | null;
  download_count: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  verification_level: string | null;
  verified_by: string | null;
  verified_at: string | null;
  moderation_notes: string | null;
  reviewed_at: string | null;
  topics_covered: string[] | null;
  learning_outcomes: string[] | null;
  total_count: number;
}

function mapSearchRow(row: SearchRow): ResourceCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    abstract: row.abstract,
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
    contributorId: row.contributor_id,
    contributorName: row.contributor_name,
    byteSize: row.byte_size,
    pageCount: row.page_count,
    legacyUrl: validateLegacyResourceUrl(row.legacy_url),
    downloadCount: row.download_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    verificationLevel: row.verification_level,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    moderationNotes: row.moderation_notes,
    reviewedAt: row.reviewed_at,
    topicsCovered: row.topics_covered ?? [],
    learningOutcomes: row.learning_outcomes ?? [],
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
    contributor_filter: filters.contributor ?? null,
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
  const lookup = getResourceLookup(resourceIdOrSlug);
  if (!lookup) return null;
  const request = supabase
    .from("resources")
    .select(
      "id,title,slug,description,abstract,academic_year,resource_type,program_id,term_id,subject_id,category_id,author_name,download_count,view_count,created_at,updated_at,current_version_id,file_url,seo_title,seo_description,verification_level,verified_by,verified_at,moderation_notes,reviewed_at,topics_covered,learning_outcomes",
    );
  const { data: resource, error } = await request
    .eq(lookup.column, lookup.value)
    .maybeSingle();
  if (error) throw error;
  if (!resource) return null;
  const [catalog, versionResult] = await Promise.all([
    fetchAcademicCatalog(),
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
  const { data: contributorRows, error: contributorError } = await supabase.rpc(
    "get_public_resource_contributor",
    { target_resource_id: resource.id },
  );
  if (contributorError) throw contributorError;
  const contributor = Array.isArray(contributorRows)
    ? contributorRows[0]
    : null;
  return {
    id: resource.id,
    title: resource.title,
    slug: resource.slug,
    description: resource.description,
    abstract: resource.abstract ?? null,
    academicYear: resource.academic_year,
    resourceType: resource.resource_type,
    programId: academic.programId,
    programName: academic.programName,
    curriculumVersionId: academic.curriculumVersionId,
    curriculumName: academic.curriculumName,
    facultyId: academic.facultyId,
    facultyName: academic.facultyName,
    termId: academic.termId,
    termName: academic.termName,
    subjectId: academic.subjectId,
    subjectCode: academic.subjectCode,
    subjectName: academic.subjectName,
    categoryId: resource.category_id,
    categoryName: category?.name ?? "Resource",
    contributorId: contributor?.id ?? null,
    contributorName: contributor?.name ?? resource.author_name ?? "Contributor",
    byteSize: versionResult.data?.byte_size ?? null,
    pageCount: versionResult.data?.page_count ?? null,
    legacyUrl: validateLegacyResourceUrl(resource.file_url),
    downloadCount: resource.download_count,
    createdAt: resource.created_at,
    updatedAt: resource.updated_at,
    viewCount: resource.view_count,
    seoTitle: resource.seo_title ?? null,
    seoDescription: resource.seo_description ?? null,
    verificationLevel: resource.verification_level ?? null,
    verifiedBy: resource.verified_by ?? null,
    verifiedAt: resource.verified_at ?? null,
    moderationNotes: resource.moderation_notes ?? null,
    reviewedAt: resource.reviewed_at ?? null,
    topicsCovered: resource.topics_covered ?? [],
    learningOutcomes: resource.learning_outcomes ?? [],
  };
}

export interface PublicContributorProfile {
  id: string;
  name: string;
  faculty: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  resourceCount: number;
  ratingCount: number;
  averageRating: number;
}

export interface PublicResourceRating {
  id: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
  reviewerId: string;
  reviewerName: string;
  reviewerFaculty: string;
  reviewerAvatarUrl: string | null;
}

export async function fetchPublicContributorProfile(
  userId: string,
): Promise<PublicContributorProfile | null> {
  const { data, error } = await supabase.rpc("get_public_contributor_profile", {
    target_user_id: userId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    faculty: row.faculty,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
    resourceCount: Number(row.resource_count ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    averageRating: Number(row.average_rating ?? 0),
  };
}

export async function fetchPublicResourceRatings(
  resourceId: string,
  page = 1,
  pageSize = 5,
): Promise<{ items: PublicResourceRating[]; total: number }> {
  const { data, error } = await supabase.rpc("list_public_resource_ratings", {
    target_resource_id: resourceId,
    page_number: page,
    page_size: pageSize,
  });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    rating: number;
    review_text: string | null;
    created_at: string;
    reviewer_id: string;
    reviewer_name: string;
    reviewer_faculty: string;
    reviewer_avatar_url: string | null;
    total_count: number;
  }>;
  return {
    items: rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      reviewText: row.review_text,
      createdAt: row.created_at,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_name,
      reviewerFaculty: row.reviewer_faculty,
      reviewerAvatarUrl: row.reviewer_avatar_url,
    })),
    total: Number(rows[0]?.total_count ?? 0),
  };
}

export function getResourceLookup(
  resourceIdOrSlug: string,
): { column: "id" | "slug"; value: string } | null {
  const value = normalizeResourceLookupValue(resourceIdOrSlug);
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  const isSlug =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 180;
  if (!isUuid && !isSlug) return null;
  return { column: isUuid ? "id" : "slug", value };
}

function normalizeResourceLookupValue(value: string): string {
  const trimmed = value.trim();
  const firstToken = trimmed.split(/\s+/)[0] ?? trimmed;
  return firstToken.trim();
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

export interface HomepageDiscoveryResource {
  id: string;
  slug: string;
  title: string;
  subjectName: string;
  programName: string;
  termName: string;
  downloadCount: number;
  weeklyDownloads: number;
  averageRating: number;
  ratingCount: number;
}

export async function fetchHomepageDiscovery(
  limit = 4,
): Promise<{
  mostDownloaded: HomepageDiscoveryResource[];
  topRated: HomepageDiscoveryResource[];
}> {
  const { data, error } = await supabase.rpc("get_homepage_resource_discovery", {
    result_limit: limit,
  });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    bucket: "most_downloaded" | "top_rated";
    id: string;
    slug: string;
    title: string;
    subject_name: string;
    program_name: string;
    term_name: string;
    download_count: number;
    weekly_downloads: number;
    average_rating: number;
    rating_count: number;
  }>;
  const mapRow = (row: (typeof rows)[number]): HomepageDiscoveryResource => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    subjectName: row.subject_name,
    programName: row.program_name,
    termName: row.term_name,
    downloadCount: Number(row.download_count ?? 0),
    weeklyDownloads: Number(row.weekly_downloads ?? 0),
    averageRating: Number(row.average_rating ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
  });
  return {
    mostDownloaded: rows
      .filter((item) => item.bucket === "most_downloaded")
      .map(mapRow),
    topRated: rows.filter((item) => item.bucket === "top_rated").map(mapRow),
  };
}

export async function findDuplicateResourceTitles(
  title: string,
): Promise<string[]> {
  const normalized = title.trim();
  if (normalized.length < 5) return [];
  const page = await searchResources({
    q: normalized,
    sort: "title",
    page: 1,
    pageSize: 8,
  });
  const target = normalized.toLocaleLowerCase();
  return page.items
    .map((item) => item.title.trim())
    .filter((item) => item.toLocaleLowerCase() === target);
}

export function getPublicResourceAccessUrl(resourceId: string): string {
  return `${publicEnvironment.config.supabaseUrl}/functions/v1/resource-download?resourceId=${encodeURIComponent(resourceId)}`;
}

export async function getTrackedResourceAccess(
  resourceId: string,
): Promise<{ viewerUrl: string; downloadCount: number }> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(
    `${getPublicResourceAccessUrl(resourceId)}&format=json`,
    {
      headers: {
        apikey: publicEnvironment.config.supabaseAnonKey,
        ...(data.session
          ? { Authorization: `Bearer ${data.session.access_token}` }
          : {}),
      },
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("resource_access_failed");
  const body = (await response.json()) as {
    viewerUrl?: unknown;
    downloadCount?: unknown;
  };
  if (typeof body.viewerUrl !== "string")
    throw new Error("resource_access_failed");
  const viewerUrl = new URL(body.viewerUrl);
  if (viewerUrl.protocol !== "https:")
    throw new Error("resource_access_failed");
  return {
    viewerUrl: viewerUrl.toString(),
    downloadCount: Number(body.downloadCount ?? 0),
  };
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

interface AdminResourceRpcRow {
  id: string;
  title: string;
  status: ResourceStatus;
  created_at: string;
  program_id: string;
  term_id: string;
  subject_id: string;
  owner_id: string | null;
  download_count: number;
  total_count: number;
}

export async function fetchAdminResources(
  page: number,
  pageSize: number,
  search: string,
  filters: AdminResourceFilters = {},
) {
  const [{ data, error }, catalog] = await Promise.all([
    supabase.rpc("list_admin_resources", {
      search_query: search.trim() || null,
      status_filter: filters.status ?? null,
      program_filter: filters.programId ?? null,
      term_filter: filters.termId ?? null,
      subject_filter: filters.subjectId ?? null,
      contributor_filter: filters.contributorId ?? null,
      created_from: filters.createdFrom ?? null,
      created_to: filters.createdTo ?? null,
      sort_by: filters.sort ?? "recent",
      page_number: page,
      page_size: pageSize,
    }),
    fetchAcademicCatalog(),
  ]);
  if (error) throw error;
  const rows = (data ?? []) as AdminResourceRpcRow[];
  return {
    items: rows.map((item): AdminResourceRow => {
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
    total: Number(rows[0]?.total_count ?? 0),
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
  const { data, error } = await supabase.rpc("list_resource_review_history", {
    target_resource_id: id,
  });
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
