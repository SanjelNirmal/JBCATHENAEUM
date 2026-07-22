import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";
import { queueAndDispatchPushJob } from "../_shared/pushJobs.ts";

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function dispatchSubmissionPush(
  userId: string,
  submissionId: string,
  resourceId: string,
): Promise<void> {
  await queueAndDispatchPushJob({
    resourceId,
    idempotencyKey: `resource-submitted:${submissionId}:${userId}`,
    logContext: "submission_push",
    payload: {
      title: "Submission received",
      body: "Your PDF was received and entered the manual administrator review queue.",
      category: "submission_update",
      targetUrl: "/my-submissions",
      resourceId,
      audience: { type: "users", userIds: [userId] },
      initiatedBy: userId,
      reuseExistingNotification: true,
    },
  });
}

async function dispatchSuperAdminSubmissionPush(
  submitterId: string,
  submissionId: string,
  resourceId: string,
): Promise<void> {
  const service = serviceClient();
  const { data: roleRows, error: rolesError } = await service
    .from("user_roles")
    .select("user_id")
    .eq("role", "super_admin")
    .neq("user_id", submitterId);

  if (rolesError) {
    console.error("super_admin_submission_roles_failed", {
      code: rolesError.code,
    });
    return;
  }

  const roleUserIds = [...new Set((roleRows ?? []).map((row) => row.user_id))];
  if (!roleUserIds.length) return;

  const { data: activeProfiles, error: profilesError } = await service
    .from("profiles")
    .select("id")
    .in("id", roleUserIds)
    .eq("account_status", "active");

  if (profilesError) {
    console.error("super_admin_submission_profiles_failed", {
      code: profilesError.code,
    });
    return;
  }

  const superAdminIds = (activeProfiles ?? []).map((profile) => profile.id);
  if (!superAdminIds.length) return;

  await queueAndDispatchPushJob({
    resourceId,
    idempotencyKey: `super-admin-resource-submitted:${submissionId}`,
    logContext: "super_admin_submission_push",
    payload: {
      title: "New file submitted",
      body: "A new PDF is waiting for administrator review.",
      category: "moderation_update",
      targetUrl: "/admin/reviews",
      resourceId,
      audience: { type: "users", userIds: superAdminIds },
      initiatedBy: submitterId,
    },
  });
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
      await Promise.all([
        dispatchSubmissionPush(user.id, submissionId, submission.resource_id),
        dispatchSuperAdminSubmissionPush(
          user.id,
          submissionId,
          submission.resource_id,
        ),
      ]);
    }
    return jsonResponse(request, { submissionId, status: "submitted" });
  } catch (error) {
    // Keep a successfully transferred quarantine object retryable. Expired
    // sessions are removed later by the cleanup job; intake failures do not
    // automatically reject the contributor's resource.
    return errorResponse(request, error);
  }
});
