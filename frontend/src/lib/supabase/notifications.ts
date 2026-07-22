import { supabase } from "./client";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  targetUrl: string;
  resourceId: string | null;
  campaignId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  nextOffset: number | null;
}

const NOTIFICATION_PAGE_SIZE = 15;

function mapNotification(item: {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  target_url: string | null;
  resource_id: string | null;
  campaign_id: string | null;
  read_at: string | null;
  created_at: string;
}): NotificationItem {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    category: item.notification_type,
    targetUrl: item.target_url || "/notifications",
    resourceId: item.resource_id,
    campaignId: item.campaign_id,
    readAt: item.read_at,
    createdAt: item.created_at,
  };
}

export async function fetchNotificationPage(
  offset = 0,
  pageSize = NOTIFICATION_PAGE_SIZE,
): Promise<NotificationPage> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,notification_type,target_url,resource_id,campaign_id,read_at,created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);
  if (error) throw error;
  const items = (data ?? []).map(mapNotification);
  return {
    items,
    nextOffset: items.length === pageSize ? offset + pageSize : null,
  };
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  return (await fetchNotificationPage(0, 50)).items;
}
export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data, error } = await supabase.rpc("mark_all_notifications_read");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}
