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
    return jsonResponse(request, { submissionId, status: "submitted" });
  } catch (error) {
    // Keep a successfully transferred quarantine object retryable. Expired
    // sessions are removed later by the cleanup job; intake failures do not
    // automatically reject the contributor's resource.
    return errorResponse(request, error);
  }
});
