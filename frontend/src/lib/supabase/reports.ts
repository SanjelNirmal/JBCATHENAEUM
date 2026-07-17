import { supabase } from "./client";
import type { ReportStatus } from "./database.types";
import { invokeFunction } from "./submissions";

export interface ResourceReport {
  id: string;
  resourceId: string;
  reporterId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}
export async function fetchReports(
  status?: ReportStatus,
  resourceId?: string,
): Promise<ResourceReport[]> {
  let query = supabase
    .from("resource_reports")
    .select("id,resource_id,reporter_id,reason,details,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  if (resourceId) query = query.eq("resource_id", resourceId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    resourceId: item.resource_id,
    reporterId: item.reporter_id,
    reason: item.reason,
    details: item.details,
    status: item.status as ReportStatus,
    createdAt: item.created_at,
  }));
}
export async function resolveReport(
  id: string,
  status: "resolved" | "dismissed",
  note: string,
) {
  const { error } = await supabase.rpc("resolve_resource_report", {
    target_report_id: id,
    resolution: status,
    supplied_resolution_note: note,
  });
  if (error) throw error;
}

export interface RemovalRequestInput {
  resourceId?: string;
  name: string;
  email: string;
  relationship: string;
  reason: string;
  details: string;
  evidenceUrl?: string;
  turnstileToken?: string;
}
export function submitRemovalRequest(input: RemovalRequestInput) {
  return invokeFunction<{ requestId: string }>("submit-removal-request", {
    ...input,
  });
}

export interface ContentRemovalRequest {
  id: string;
  resourceId: string | null;
  requesterName: string;
  requesterEmail: string;
  relationship: string;
  reason: string;
  details: string;
  evidenceUrl: string | null;
  status: ReportStatus;
  createdAt: string;
}
export async function fetchContentRemovalRequests(): Promise<
  ContentRemovalRequest[]
> {
  const { data, error } = await supabase
    .from("content_removal_requests")
    .select(
      "id,resource_id,requester_name,requester_email,relationship,reason,details,evidence_url,status,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    resourceId: item.resource_id,
    requesterName: item.requester_name,
    requesterEmail: item.requester_email,
    relationship: item.relationship,
    reason: item.reason,
    details: item.details,
    evidenceUrl: item.evidence_url,
    status: item.status as ReportStatus,
    createdAt: item.created_at,
  }));
}
export async function resolveContentRemovalRequest(
  id: string,
  status: "resolved" | "dismissed",
  note: string,
) {
  const { error } = await supabase.rpc("resolve_content_removal_request", {
    target_request_id: id,
    resolution: status,
    supplied_note: note,
  });
  if (error) throw error;
}
