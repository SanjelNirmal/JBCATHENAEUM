import { supabase } from "./client";
import { requireCurrentUserId } from "./currentUser";

export interface BookmarkItem {
  id: string;
  resourceId: string;
  title: string;
  slug: string;
  description: string | null;
  resourceType: string;
  savedAt: string;
}

export interface BookmarkPage {
  items: BookmarkItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchBookmarkState(resourceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("resource_bookmarks")
    .select("id")
    .eq("resource_id", resourceId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function fetchBookmarks(
  page = 1,
  pageSize = 12,
): Promise<BookmarkPage> {
  const from = (page - 1) * pageSize;
  const { data, count, error } = await supabase
    .from("resource_bookmarks")
    .select("id,resource_id,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  const rows = data ?? [];
  const ids = rows.map((item) => item.resource_id);
  if (ids.length === 0) return { items: [], total: count ?? 0, page, pageSize };
  const { data: resources, error: resourceError } = await supabase
    .from("resources")
    .select("id,title,slug,description,resource_type")
    .in("id", ids);
  if (resourceError) throw resourceError;
  const byId = new Map((resources ?? []).map((item) => [item.id, item]));
  return {
    items: rows.flatMap((bookmark) => {
      const resource = byId.get(bookmark.resource_id);
      return resource
        ? [
            {
              id: bookmark.id,
              resourceId: bookmark.resource_id,
              title: resource.title,
              slug: resource.slug,
              description: resource.description,
              resourceType: resource.resource_type,
              savedAt: bookmark.created_at,
            },
          ]
        : [];
    }),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function createBookmark(resourceId: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("resource_bookmarks")
    .insert({ user_id: userId, resource_id: resourceId });
  if (error && error.code !== "23505") throw error;
}

export async function deleteBookmark(resourceId: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("resource_bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("resource_id", resourceId);
  if (error) throw error;
}
