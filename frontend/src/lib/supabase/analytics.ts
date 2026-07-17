import { supabase } from "./client";

export interface AdminMetrics {
  publishedResources: number;
  pendingReviews: number;
  changesRequested: number;
  rejectedSubmissions: number;
  newUsersThisMonth: number;
  downloadsThisMonth: number;
  storageBytes: number;
  flaggedResources: number;
  failedUploads: number;
  missingMetadata: number;
  pendingStorageCleanup: number;
}
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const { data, error } = await supabase.rpc("admin_dashboard_metrics");
  if (error) throw error;
  const value = data as Record<string, number>;
  return {
    publishedResources: value.publishedResources ?? 0,
    pendingReviews: value.pendingReviews ?? 0,
    changesRequested: value.changesRequested ?? 0,
    rejectedSubmissions: value.rejectedSubmissions ?? 0,
    newUsersThisMonth: value.newUsersThisMonth ?? 0,
    downloadsThisMonth: value.downloadsThisMonth ?? 0,
    storageBytes: value.storageBytes ?? 0,
    flaggedResources: value.flaggedResources ?? 0,
    failedUploads: value.failedUploads ?? 0,
    missingMetadata: value.missingMetadata ?? 0,
    pendingStorageCleanup: value.pendingStorageCleanup ?? 0,
  };
}

export interface AuditEvent {
  id: number;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}
export async function fetchAuditEvents(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const { data, count, error } = await supabase
    .from("audit_events")
    .select("id,actor_id,action,entity_type,entity_id,metadata,created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return {
    items: (data ?? []).map(
      (item) =>
        ({
          id: item.id,
          actorId: item.actor_id,
          action: item.action,
          entityType: item.entity_type,
          entityId: item.entity_id,
          metadata: item.metadata,
          createdAt: item.created_at,
        }) as AuditEvent,
    ),
    total: count ?? 0,
  };
}
