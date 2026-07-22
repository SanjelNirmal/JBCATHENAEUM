import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function dispatchSubmissionPush(
  request: Request,
  userId: string,
  resourceId: string,
): Promise<void> {
  const service = serviceClient();
  const payload = {
    title: "Submission received",
    body: "Your PDF was received and entered the manual administrator review queue.",
    category: "submission_update",
    targetUrl: "/my-submissions",
    resourceId,
    audience: { type: "users", userIds: [userId] },
    reuseExistingNotification: true,
  };
  const { data: job, error: jobError } = await service
    .from("push_notification_jobs")
    .upsert(
      {
        resource_id: resourceId,
        idempotency_key: `resource-submitted:${resourceId}:${userId}`,
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
      console.error("submission_push_dispatch_deferred", { jobId: job.id });
    }
  }
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { user } = await authenticatedUser(request);
    const body = await request.json();
    const sessionId = String(body.sessionId ?? "");
    if (!sessionId)
      throw new PublicError("invalid_session", "Upload session is required.");

    const service = serviceClient();
    const { data: session, error: sessionError } = await service
      .from("resource_upload_sessions")
      .select(
        "id,user_id,storage_bucket,storage_path,expected_byte_size,status,expires_at",
      )
      .eq("id", sessionId)
      .single();
    if (sessionError || !session)
      throw new PublicError(
        "invalid_session",
        "Upload session was not found.",
        404,
      );
    if (session.user_id !== user.id)
      throw new PublicError(
        "forbidden",
        "Upload session ownership mismatch.",
        403,
      );
    if (
      session.status !== "issued" ||
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      throw new PublicError(
        "expired_session",
        "Upload session has expired.",
        409,
      );
    }

    const { data: file, error: downloadError } = await service.storage
      .from(session.storage_bucket)
      .download(session.storage_path);
    if (downloadError || !file)
      throw new PublicError(
        "upload_missing",
        "The uploaded object could not be found.",
        409,
      );

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength !== session.expected_byte_size) {
      throw new PublicError(
        "size_mismatch",
        "The uploaded PDF size does not match the issued upload.",
      );
    }

    const checksum = toHex(await crypto.subtle.digest("SHA-256", bytes));
    const { data: submissionId, error: completeError } = await service.rpc(
      "complete_resource_upload",
      {
        target_session_id: sessionId,
        request_user_id: user.id,
        actual_byte_size: bytes.byteLength,
        checksum_sha256: checksum,
        detected_page_count: null,
        validation_result: {
          validator: "manual-review-intake-v1",
          automated_content_decision: false,
          manual_review_required: true,
        },
      },
    );
    if (completeError) {
      throw completeError;
    }
    const { data: submission } = await service
      .from("resource_submissions")
      .select("resource_id")
      .eq("id", submissionId)
      .maybeSingle();
    if (submission?.resource_id) {
      await dispatchSubmissionPush(request, user.id, submission.resource_id);
    }
    return jsonResponse(request, { submissionId, status: "submitted" });
  } catch (error) {
    // Keep a successfully transferred quarantine object retryable. Expired
    // sessions are removed later by the cleanup job; intake failures do not
    // automatically reject the contributor's resource.
    return errorResponse(request, error);
  }
});
