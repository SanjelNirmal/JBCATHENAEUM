import { supabase } from "./client";
import { invokeFunction } from "./submissions";

export interface ReviewQueueItem {
  submissionId: string;
  resourceId: string;
  versionId: string;
  submitterId: string;
  contributor: string;
  status:
    | "submitted"
    | "under_review"
    | "changes_requested"
    | "approved"
    | "rejected";
  submittedAt: string;
  title: string;
  program: string;
  faculty: string;
  term: string;
  semester: string;
  subject: string;
  category: string;
  byteSize: number | null;
  pageCount: number | null;
  mimeType: string;
  scanStatus: string;
  duplicateWarning: boolean;
  reviewNotes: string[];
}

export async function fetchReviewQueue(
  page = 1,
  pageSize = 20,
  search = "",
  status?: ReviewQueueItem["status"],
) {
  const { data, error } = await supabase.rpc("list_review_queue", {
    search_query: search.trim() || null,
    status_filter: status ?? null,
    page_number: page,
    page_size: pageSize,
  });
  if (error) throw error;
  const rows = data ?? [];
  const items = rows.map(
    (row): ReviewQueueItem => ({
      submissionId: row.submission_id,
      resourceId: row.resource_id,
      versionId: row.version_id,
      submitterId: row.submitter_id,
      contributor: row.contributor,
      status: row.status as ReviewQueueItem["status"],
      submittedAt: row.submitted_at,
      title: row.title,
      program: row.program,
      faculty: row.faculty,
      term: row.term,
      semester: row.term,
      subject: row.subject,
      category: row.category,
      byteSize: row.byte_size,
      pageCount: row.page_count,
      mimeType: row.mime_type,
      scanStatus: row.scan_status,
      duplicateWarning: row.duplicate_warning,
      reviewNotes: row.review_notes,
    }),
  );
  return { items, total: rows[0]?.total_count ?? 0 };
}

export async function claimResourceReview(id: string) {
  const { error } = await supabase.rpc("claim_resource_review", {
    target_submission_id: id,
  });
  if (error) throw error;
}
export async function assignResourceReviewer(
  submissionId: string,
  reviewerId: string,
) {
  const { error } = await supabase.rpc("assign_resource_reviewer", {
    target_submission_id: submissionId,
    target_reviewer_id: reviewerId,
  });
  if (error) throw error;
}
export async function archiveReviewSubmission(
  submissionId: string,
  reason: string,
) {
  const { error } = await supabase.rpc("archive_review_submission", {
    target_submission_id: submissionId,
    supplied_reason: reason,
  });
  if (error) throw error;
}
export async function decideResourceReview(
  submissionId: string,
  outcome: "approved" | "changes_requested" | "rejected",
  explanation: string,
) {
  return invokeFunction<{ status: string; cleanupPending: boolean }>(
    "decide-resource-review",
    { submissionId, outcome, explanation },
  );
}
export async function getReviewFileUrl(versionId: string) {
  const data = await invokeFunction<{ signedUrl: string }>(
    "review-resource-file",
    { versionId },
  );
  return data.signedUrl;
}
export async function publishApprovedResource(resourceId: string) {
  return invokeFunction<{ status: string; cleanupPending?: boolean }>(
    "publish-resource",
    { resourceId },
  );
}
export async function addReviewComment(
  submissionId: string,
  comment: string,
  internal = true,
) {
  const { error } = await supabase.rpc("add_review_comment", {
    target_submission_id: submissionId,
    comment_body: comment,
    internal_comment: internal,
  });
  if (error) throw error;
}
