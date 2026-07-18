import { supabase } from "./client";

export interface DownloadHistoryItem {
  id: number;
  resourceId: string;
  title: string;
  slug: string;
  versionNumber: number | null;
  downloadedAt: string;
}

export interface DownloadHistoryPage {
  items: DownloadHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchDownloadHistory(
  page = 1,
  pageSize = 20,
): Promise<DownloadHistoryPage> {
  const { data, error } = await supabase.rpc("list_my_download_history", {
    page_number: page,
    page_size: pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  return {
    items: rows.map((item) => ({
      id: item.event_id,
      resourceId: item.resource_id,
      title: item.resource_title,
      slug: item.resource_slug,
      versionNumber: item.version_number,
      downloadedAt: item.downloaded_at,
    })),
    total: Number(rows[0]?.total_count ?? 0),
    page,
    pageSize,
  };
}
