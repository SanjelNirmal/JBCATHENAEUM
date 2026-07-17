import { supabase } from "./client";
import { fetchAcademicCatalog } from "./academic";
import { invokeFunction } from "./submissions";

export interface ReviewQueueItem {
  submissionId: string;
  resourceId: string;
  versionId: string;
  submitterId: string;
  contributor: string;
  status: "submitted" | "under_review" | "approved";
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
  const from = (page - 1) * pageSize;
  let matchingResourceIds: string[] | null = null;
  if (search.trim()) {
    const { data, error } = await supabase
      .from("resources")
      .select("id")
      .ilike("title", `%${search.trim()}%`);
    if (error) throw error;
    matchingResourceIds = (data ?? []).map((resource) => resource.id);
    if (!matchingResourceIds.length)
      return { items: [] as ReviewQueueItem[], total: 0 };
  }
  let query = supabase
    .from("resource_submissions")
    .select("id,resource_id,version_id,submitter_id,status,submitted_at", {
      count: "exact",
    })
    .in(
      "status",
      status ? [status] : ["submitted", "under_review", "approved"],
    );
  if (matchingResourceIds) query = query.in("resource_id", matchingResourceIds);
  query = query.order("submitted_at").range(from, from + pageSize - 1);
  const { data: submissions, count, error } = await query;
  if (error) throw error;
  if (!submissions?.length) return { items: [] as ReviewQueueItem[], total: 0 };
  const [resources, versions, profiles, comments, catalog] = await Promise.all([
    supabase
      .from("resources")
      .select("id,title,subject_id,category_id")
      .in(
        "id",
        submissions.map((item) => item.resource_id),
      ),
    supabase
      .from("resource_versions")
      .select("id,byte_size,page_count,mime_type,scan_status")
      .in(
        "id",
        submissions.map((item) => item.version_id),
      ),
    supabase
      .from("profiles")
      .select("id,name")
      .in(
        "id",
        submissions.map((item) => item.submitter_id),
      ),
    supabase
      .from("review_comments")
      .select("submission_id,body,created_at")
      .in(
        "submission_id",
        submissions.map((item) => item.id),
      )
      .order("created_at", { ascending: false }),
    fetchAcademicCatalog(),
  ]);
  if (resources.error) throw resources.error;
  if (versions.error) throw versions.error;
  if (profiles.error) throw profiles.error;
  if (comments.error) throw comments.error;
  const items = submissions.flatMap((submission) => {
    const resource = (resources.data ?? []).find(
      (item) => item.id === submission.resource_id,
    );
    const version = (versions.data ?? []).find(
      (item) => item.id === submission.version_id,
    );
    const academic = catalog.find(
      (item) => item.subjectId === resource?.subject_id,
    );
    if (!resource || !version || !academic) return [];
    return [
      {
        submissionId: submission.id,
        resourceId: submission.resource_id,
        versionId: submission.version_id,
        submitterId: submission.submitter_id,
        contributor:
          (profiles.data ?? []).find(
            (item) => item.id === submission.submitter_id,
          )?.name ?? "Contributor",
        status: submission.status as ReviewQueueItem["status"],
        submittedAt: submission.submitted_at,
        title: resource.title,
        program: academic.programName,
        faculty: academic.facultyName,
        term: academic.termName,
        semester: academic.termName,
        subject: academic.subjectName,
        category:
          academic.categories.find((item) => item.id === resource.category_id)
            ?.name ?? "—",
        byteSize: version.byte_size,
        pageCount: version.page_count,
        mimeType: version.mime_type,
        scanStatus: version.scan_status,
        // Exact clean/legacy checksum matches are rejected transactionally
        // before a submission can enter this queue.
        duplicateWarning: false,
        reviewNotes: (comments.data ?? [])
          .filter((comment) => comment.submission_id === submission.id)
          .slice(0, 3)
          .map((comment) => comment.body),
      },
    ];
  });
  return { items, total: count ?? items.length };
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
