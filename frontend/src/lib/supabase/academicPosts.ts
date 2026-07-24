import { z } from "zod";
import type {
  AcademicPost,
  AcademicPostCategory,
  AcademicPostInput,
  AcademicPostProgram,
  AcademicPostStats,
  AdminAcademicPostFilters,
  PaginatedAcademicPosts,
  PublishedAcademicPostFilters,
} from "../../features/academic-posts/types";
import { supabase } from "./client";

const POST_SELECT = `
  id,title,slug,excerpt,body,program_id,category_id,author_id,author_name,
  cover_image_path,cover_image_url,drive_url,resource_count,
  reading_time_minutes,status,is_featured,featured_order,published_at,
  scheduled_for,archived_at,view_count,drive_open_count,share_count,
  seo_title,seo_description,created_at,updated_at,deleted_at,
  programs(id,name,slug,code),
  academic_post_categories(id,name,slug,description,is_active,sort_order,created_at,updated_at)
`;

type PostRelationRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  program_id: string | null;
  category_id: string;
  author_id: string | null;
  author_name: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  drive_url: string | null;
  resource_count: number;
  reading_time_minutes: number;
  status: AcademicPost["status"];
  is_featured: boolean;
  featured_order: number | null;
  published_at: string | null;
  scheduled_for: string | null;
  archived_at: string | null;
  view_count: number;
  drive_open_count: number;
  share_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  programs:
    | { id: string; name: string; slug: string; code: string | null }
    | Array<{ id: string; name: string; slug: string; code: string | null }>
    | null;
  academic_post_categories:
    | {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        is_active: boolean;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        is_active: boolean;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }>;
};

const driveUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "drive.google.com" ||
        url.hostname === "docs.google.com")
    );
  }, "Use a valid HTTPS Google Drive or Google Docs URL.");

export function validateAcademicPostDriveUrl(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;
  return driveUrlSchema.parse(normalized);
}

export function slugifyAcademicPost(value: string): string {
  return (
    value
      .toLocaleLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 180) || "academic-post"
  );
}

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function signedCoverUrl(
  coverImagePath: string | null,
  fallbackUrl: string | null,
): Promise<string | null> {
  if (fallbackUrl?.startsWith("https://")) return fallbackUrl;
  if (!coverImagePath) return null;
  const { data, error } = await supabase.storage
    .from("academic-post-covers")
    .createSignedUrl(coverImagePath, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function mapPost(row: PostRelationRow): Promise<AcademicPost> {
  const program = relationOne(row.programs);
  const category = relationOne(row.academic_post_categories);
  if (!category) throw new Error("Academic post category is unavailable.");
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    authorId: row.author_id,
    authorName: row.author_name?.trim() || "JBC Athenaeum",
    program,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.is_active,
      sortOrder: category.sort_order,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    },
    coverImagePath: row.cover_image_path,
    coverImageUrl: await signedCoverUrl(
      row.cover_image_path,
      row.cover_image_url,
    ),
    driveUrl: row.drive_url,
    resourceCount: row.resource_count,
    readingTimeMinutes: row.reading_time_minutes,
    status: row.status,
    isFeatured: row.is_featured,
    featuredOrder: row.featured_order,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    archivedAt: row.archived_at,
    viewCount: row.view_count,
    driveOpenCount: row.drive_open_count,
    shareCount: row.share_count,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

async function mapPosts(rows: PostRelationRow[]): Promise<AcademicPost[]> {
  return Promise.all(rows.map(mapPost));
}

async function publishDueAcademicPosts() {
  const { error } = await supabase.rpc("publish_due_academic_posts");
  if (error) throw error;
}

function normalizedSearch(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export async function fetchPublishedAcademicPosts(
  filters: PublishedAcademicPostFilters = {},
): Promise<PaginatedAcademicPosts> {
  await publishDueAcademicPosts();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(30, Math.max(1, filters.pageSize ?? 9));
  const from = (page - 1) * pageSize;
  const search = normalizedSearch(filters.search);
  let query = supabase
    .from("academic_posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .is("deleted_at", null);
  if (search)
    query = query.textSearch("search_document", search, {
      type: "websearch",
      config: "simple",
    });
  if (filters.programId) query = query.eq("program_id", filters.programId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  query = query.order("published_at", {
    ascending: filters.sort === "oldest",
  });
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return {
    items: await mapPosts((data ?? []) as unknown as PostRelationRow[]),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchFeaturedAcademicPost(): Promise<AcademicPost | null> {
  await publishDueAcademicPosts();
  const { data, error } = await supabase
    .from("academic_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .lte("published_at", new Date().toISOString())
    .is("deleted_at", null)
    .order("featured_order")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data as unknown as PostRelationRow) : null;
}

export async function fetchAcademicPostBySlug(
  slug: string,
): Promise<AcademicPost | null> {
  await publishDueAcademicPosts();
  const { data, error } = await supabase
    .from("academic_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data as unknown as PostRelationRow) : null;
}

export async function fetchRelatedAcademicPosts(
  post: AcademicPost,
  limit = 3,
): Promise<AcademicPost[]> {
  let query = supabase
    .from("academic_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .is("deleted_at", null)
    .neq("id", post.id)
    .eq("category_id", post.category.id)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (post.program) query = query.eq("program_id", post.program.id);
  const { data, error } = await query;
  if (error) throw error;
  return mapPosts((data ?? []) as unknown as PostRelationRow[]);
}

export async function fetchAcademicPostCategories(
  includeInactive = false,
): Promise<AcademicPostCategory[]> {
  let query = supabase
    .from("academic_post_categories")
    .select(
      "id,name,slug,description,is_active,sort_order,created_at,updated_at",
    )
    .order("sort_order")
    .order("name");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchAcademicPostPrograms(): Promise<
  AcademicPostProgram[]
> {
  const { data, error } = await supabase
    .from("programs")
    .select("id,name,slug,code")
    .in("slug", ["bca", "bicte", "bbs", "mbs"])
    .eq("is_active", true)
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchAdminAcademicPosts(
  filters: AdminAcademicPostFilters = {},
): Promise<PaginatedAcademicPosts> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const search = normalizedSearch(filters.search);
  let query = supabase
    .from("academic_posts")
    .select(POST_SELECT, { count: "exact" });
  if (search)
    query = query.textSearch("search_document", search, {
      type: "websearch",
      config: "simple",
    });
  if (filters.status === "deleted") query = query.not("deleted_at", "is", null);
  else {
    query = query.is("deleted_at", null);
    if (filters.status) query = query.eq("status", filters.status);
  }
  if (filters.programId) query = query.eq("program_id", filters.programId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.authorId) query = query.eq("author_id", filters.authorId);
  if (filters.authorName)
    query = query.ilike(
      "author_name",
      `%${normalizedSearch(filters.authorName).replace(/[%_]/g, "")}%`,
    );
  if (filters.featured !== undefined)
    query = query.eq("is_featured", filters.featured);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lt("created_at", filters.dateTo);
  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return {
    items: await mapPosts((data ?? []) as unknown as PostRelationRow[]),
    total: count ?? 0,
    page,
    pageSize,
  };
}

async function countPosts(filters: {
  status?: AcademicPost["status"];
  featured?: boolean;
}) {
  let query = supabase
    .from("academic_posts")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.featured !== undefined)
    query = query.eq("is_featured", filters.featured);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchAdminAcademicPostStats(): Promise<AcademicPostStats> {
  const [total, published, drafts, scheduled, archived, featured] =
    await Promise.all([
      countPosts({}),
      countPosts({ status: "published" }),
      countPosts({ status: "draft" }),
      countPosts({ status: "scheduled" }),
      countPosts({ status: "archived" }),
      countPosts({ featured: true }),
    ]);
  return { total, published, drafts, scheduled, archived, featured };
}

export async function fetchAcademicPostById(
  id: string,
): Promise<AcademicPost | null> {
  const { data, error } = await supabase
    .from("academic_posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data as unknown as PostRelationRow) : null;
}

function inputRow(input: AcademicPostInput) {
  return {
    title: input.title.trim(),
    slug: slugifyAcademicPost(input.slug),
    excerpt: input.excerpt.trim(),
    body: input.body.trim(),
    program_id: input.programId,
    category_id: input.categoryId,
    author_name: input.authorName.trim(),
    drive_url: validateAcademicPostDriveUrl(input.driveUrl ?? ""),
    resource_count: input.resourceCount,
    reading_time_minutes: input.readingTimeMinutes,
    status: input.status,
    // Feature changes go through the atomic RPC so the single-primary
    // featured constraint can never race an existing featured post.
    is_featured: false,
    published_at: input.publishedAt,
    scheduled_for: input.scheduledFor,
    archived_at: input.status === "archived" ? new Date().toISOString() : null,
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
  };
}

export async function createAcademicPost(
  input: AcademicPostInput,
  authorId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("academic_posts")
    .insert({ ...inputRow(input), author_id: authorId })
    .select("id")
    .single();
  if (error) throw error;
  if (input.isFeatured)
    await setFeaturedAcademicPost(data.id, input.isFeatured);
  return data.id;
}

export async function updateAcademicPost(id: string, input: AcademicPostInput) {
  const row = inputRow({ ...input, isFeatured: false });
  const { error } = await supabase
    .from("academic_posts")
    .update(row)
    .eq("id", id);
  if (error) throw error;
  await setFeaturedAcademicPost(id, input.isFeatured);
}

export async function isAcademicPostSlugAvailable(
  slug: string,
  currentId?: string,
): Promise<boolean> {
  let query = supabase
    .from("academic_posts")
    .select("id")
    .eq("slug", slugifyAcademicPost(slug));
  if (currentId) query = query.neq("id", currentId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data ?? []).length === 0;
}

async function stateRpc(
  name:
    | "publish_academic_post"
    | "unpublish_academic_post"
    | "archive_academic_post"
    | "restore_academic_post"
    | "soft_delete_academic_post"
    | "restore_deleted_academic_post",
  id: string,
) {
  const { error } = await supabase.rpc(name, { target_post_id: id });
  if (error) throw error;
}

export const publishAcademicPost = (id: string) =>
  stateRpc("publish_academic_post", id);
export const unpublishAcademicPost = (id: string) =>
  stateRpc("unpublish_academic_post", id);
export const archiveAcademicPost = (id: string) =>
  stateRpc("archive_academic_post", id);
export const restoreAcademicPost = (id: string) =>
  stateRpc("restore_academic_post", id);
export const deleteAcademicPost = (id: string) =>
  stateRpc("soft_delete_academic_post", id);
export const restoreDeletedAcademicPost = (id: string) =>
  stateRpc("restore_deleted_academic_post", id);

export async function setFeaturedAcademicPost(id: string, featured: boolean) {
  const { error } = await supabase.rpc("set_featured_academic_post", {
    target_post_id: id,
    should_feature: featured,
  });
  if (error) throw error;
}

function academicPostSessionKey(): string {
  const keyName = "jbc-academic-post-session";
  try {
    const existing = window.sessionStorage.getItem(keyName);
    if (existing) return existing;
    const value = crypto.randomUUID();
    window.sessionStorage.setItem(keyName, value);
    return value;
  } catch {
    return crypto.randomUUID();
  }
}

export async function incrementAcademicPostView(slug: string) {
  const { data, error } = await supabase.rpc("increment_academic_post_view", {
    post_slug: slug,
    supplied_session_key: academicPostSessionKey(),
  });
  if (error) throw error;
  return data;
}

export async function recordAcademicPostEvent(
  slug: string,
  eventType: "drive_open" | "share",
) {
  const { error } = await supabase.rpc("record_academic_post_event", {
    post_slug: slug,
    requested_event_type: eventType,
    supplied_session_key: academicPostSessionKey(),
  });
  if (error) throw error;
}

const allowedCoverTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxCoverBytes = 5 * 1024 * 1024;

export function validateAcademicPostCover(file: File) {
  if (!allowedCoverTypes.has(file.type))
    throw new Error("Cover images must be JPEG, PNG, or WebP.");
  if (file.size <= 0 || file.size > maxCoverBytes)
    throw new Error("Cover images must be smaller than 5 MB.");
}

export async function uploadAcademicPostCover(postId: string, file: File) {
  validateAcademicPostCover(file);
  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${postId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("academic-post-covers")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;
  const { error: updateError } = await supabase
    .from("academic_posts")
    .update({ cover_image_path: path, cover_image_url: null })
    .eq("id", postId);
  if (updateError) {
    await supabase.storage.from("academic-post-covers").remove([path]);
    throw updateError;
  }
  return path;
}

export async function deleteAcademicPostCover(
  postId: string,
  path: string | null,
) {
  const { error } = await supabase
    .from("academic_posts")
    .update({ cover_image_path: null, cover_image_url: null })
    .eq("id", postId);
  if (error) throw error;
  if (path) {
    const { error: storageError } = await supabase.storage
      .from("academic-post-covers")
      .remove([path]);
    if (storageError) throw storageError;
  }
}

export async function deleteAcademicPostCoverFile(path: string | null) {
  if (!path) return;
  const { error } = await supabase.storage
    .from("academic-post-covers")
    .remove([path]);
  if (error) throw error;
}

export async function createAcademicPostCategory(input: {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
}) {
  const { error } = await supabase.from("academic_post_categories").insert({
    name: input.name.trim(),
    slug: slugifyAcademicPost(input.slug),
    description: input.description.trim() || null,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
}

export async function updateAcademicPostCategory(
  id: string,
  input: {
    name: string;
    slug: string;
    description: string;
    isActive: boolean;
    sortOrder: number;
  },
) {
  const { error } = await supabase
    .from("academic_post_categories")
    .update({
      name: input.name.trim(),
      slug: slugifyAcademicPost(input.slug),
      description: input.description.trim() || null,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq("id", id);
  if (error) throw error;
}
