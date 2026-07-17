import { supabase } from "./client";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}
export async function fetchNotifications(): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,notification_type,entity_id,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.notification_type,
    entityId: item.entity_id,
    readAt: item.read_at,
    createdAt: item.created_at,
  }));
}
export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
