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

const outcomes = new Set(["approved", "changes_requested", "rejected"]);

async function dispatchReviewPush(
  request: Request,
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

  const body = outcome === "approved"
    ? "Your resource was approved and is awaiting publication."
    : outcome === "changes_requested"
    ? "Changes were requested for your resource."
    : "Your resource submission was rejected.";

  const payload = {
    title: "Resource review updated",
    body,
    category: "submission_update",
    targetUrl: "/my-submissions",
    resourceId: submission.resource_id,
    audience: { type: "users", userIds: [submission.submitter_id] },
    reuseExistingNotification: true,
  };
  const { data: job, error: jobError } = await service
    .from("push_notification_jobs")
    .upsert(
      {
        resource_id: submission.resource_id,
        idempotency_key: `resource-review:${submissionId}:${outcome}`,
        payload,
        status: "queued",
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (!jobError && job?.id) {
    const authorization = request.headers.get("authorization") ?? "";
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
      {
        method: "POST",
        headers: { authorization, "content-type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      },
    ).catch(() => null);
    if (!response?.ok) {
      console.error("resource_review_push_dispatch_deferred", { jobId: job.id });
    }
  }
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { client: userSupabase } = await authenticatedUser(request);
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
    await dispatchReviewPush(request, submissionId, outcome);

    // A clean, reviewer-rejected version stays in private quarantine so
    // authorized staff can audit it later. Automated validation failures are
    // still removed by finalize-upload.
    return jsonResponse(request, { status: outcome, cleanupPending: false });
  } catch (error) {
    return errorResponse(request, error);
  }
});
