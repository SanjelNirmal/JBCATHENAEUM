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

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { client: userSupabase } = await authenticatedUser(request);
    await requireAal2(userSupabase);
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

    const service = serviceClient();
    const { data: submission, error: submissionError } = await service
      .from("resource_submissions")
      .select("version_id")
      .eq("id", submissionId)
      .single();
    if (submissionError || !submission) {
      throw new PublicError("not_found", "Submission was not found.", 404);
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

    let cleanupPending = false;
    if (outcome !== "approved") {
      const { data: version } = await service
        .from("resource_versions")
        .select("storage_bucket,storage_path")
        .eq("id", submission.version_id)
        .single();
      if (version?.storage_bucket === "resource-quarantine") {
        const { error: removeError } = await service.storage
          .from(version.storage_bucket)
          .remove([version.storage_path]);
        cleanupPending = Boolean(removeError);
        await service
          .from("resource_upload_sessions")
          .update({
            failure_code: removeError ? "review_cleanup_pending" : null,
          })
          .eq("version_id", submission.version_id);
      }
    }

    return jsonResponse(request, { status: outcome, cleanupPending });
  } catch (error) {
    return errorResponse(request, error);
  }
});
