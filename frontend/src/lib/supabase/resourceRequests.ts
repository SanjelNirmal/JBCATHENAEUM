import { supabase } from "./client";

export type ResourceRequestStatus =
  | "open"
  | "planned"
  | "fulfilled"
  | "closed"
  | "rejected";

export interface ResourceRequestRow {
  id: string;
  title: string;
  description: string | null;
  status: ResourceRequestStatus;
  requestCount: number;
  createdAt: string;
  updatedAt: string;
  programId: string | null;
  termId: string | null;
  subjectId: string | null;
  categoryId: string | null;
  fulfilledResourceId: string | null;
}

export async function listPublicResourceRequests() {
  const { data, error } = await (supabase as any).rpc(
    "list_public_resource_requests",
  );
  if (error) throw error;
  return ((data ?? []) as any[]).map(
    (item): ResourceRequestRow => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      requestCount: Number(item.request_count ?? 0),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      programId: item.program_id,
      termId: item.term_id,
      subjectId: item.subject_id,
      categoryId: item.category_id,
      fulfilledResourceId: item.fulfilled_resource_id,
    }),
  );
}

export async function createResourceRequest(input: {
  programId?: string;
  termId?: string;
  subjectId?: string;
  categoryId?: string;
  title: string;
  description?: string;
}) {
  const { error } = await (supabase as any).rpc("submit_resource_request", {
    target_program_id: input.programId ?? null,
    target_term_id: input.termId ?? null,
    target_subject_id: input.subjectId ?? null,
    target_category_id: input.categoryId ?? null,
    requested_title: input.title,
    requested_description: input.description ?? null,
  });
  if (error) throw error;
}

export async function supportResourceRequest(requestId: string) {
  const { error } = await (supabase as any).rpc("support_resource_request", {
    target_request_id: requestId,
  });
  if (error) throw error;
}

export async function listAdminResourceRequests() {
  const { data, error } = await (supabase as any).rpc("list_admin_resource_requests");
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    title: string;
    status: ResourceRequestStatus;
    request_count: number;
  }>;
}

export async function updateResourceRequestStatus(input: {
  requestId: string;
  status: ResourceRequestStatus;
  fulfilledResourceId?: string;
}) {
  const { error } = await (supabase as any).rpc("update_resource_request_status", {
    target_request_id: input.requestId,
    next_status: input.status,
    next_fulfilled_resource_id: input.fulfilledResourceId ?? null,
  });
  if (error) throw error;
}
