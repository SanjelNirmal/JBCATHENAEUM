import {
  authenticatedUser,
  requireAal2,
  serviceClient,
} from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";
import { queueAndDispatchPushJob } from "../_shared/pushJobs.ts";

const outcomes = new Set(["approved", "changes_requested", "rejected"]);

async function dispatchReviewPush(
  reviewerId: string,
  submissionId: string,
  outcome: string,
): Promise<void> {
  const service = serviceClient();
  const { data: submission } = await service
    .from("resource_submissions")
    .select("submitter_id,resource_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission?.submitter_id || !submission.resource_id) return;

  const body =
    outcome === "approved"
      ? "Your resource was approved and is awaiting publication."
      : outcome === "changes_requested"
        ? "Changes were requested for your resource."
        : "Your resource submission was rejected.";

  await queueAndDispatchPushJob({
    resourceId: submission.resource_id,
    idempotencyKey: `resource-review:${submissionId}:${outcome}`,
    logContext: "resource_review_push",
    payload: {
      title: "Resource review updated",
      body,
      category: "submission_update",
      targetUrl: "/my-submissions",
      resourceId: submission.resource_id,
      audience: { type: "users", userIds: [submission.submitter_id] },
      initiatedBy: reviewerId,
      reuseExistingNotification: true,
    },
  });
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { user, client: userSupabase } = await authenticatedUser(request);
    await requireAal2(userSupabase, request);
    const body = await request.json();
    const submissionId = String(body.submissionId ?? "");
    const outcome = String(body.outcome ?? "");
    const explanation = String(body.explanation ?? "").trim();
    if (!submissionId || !outcomes.has(outcome)) {
      throw new PublicError(
        "invalid_review",
        "A valid submission and review outcome are required.",
      );
    }
    if (outcome !== "approved" && explanation.length < 3) {
      throw new PublicError(
        "explanation_required",
        "Explain the rejection or requested changes.",
      );
    }

    const { error: reviewError } = await userSupabase.rpc(
      "decide_resource_review",
      {
        target_submission_id: submissionId,
        review_outcome: outcome,
        reviewer_comment: explanation || null,
        supplied_rejection_reason: outcome === "rejected" ? explanation : null,
        supplied_requested_changes:
          outcome === "changes_requested" ? explanation : null,
      },
    );
    if (reviewError) throw reviewError;
    await dispatchReviewPush(user.id, submissionId, outcome);

    // A clean, reviewer-rejected version stays in private quarantine so
    // authorized staff can audit it later. Automated validation failures are
    // still removed by finalize-upload.
    return jsonResponse(request, { status: outcome, cleanupPending: false });
  } catch (error) {
    return errorResponse(request, error);
  }
});
