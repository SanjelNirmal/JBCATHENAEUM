import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { user } = await authenticatedUser(request);
    const { sessionId } = await request.json();
    if (!sessionId)
      throw new PublicError("invalid_session", "Upload session is required.");

    const service = serviceClient();
    const { data: session, error } = await service
      .from("resource_upload_sessions")
      .select("user_id,storage_bucket,storage_path,status")
      .eq("id", sessionId)
      .single();
    if (error || !session)
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
    if (["submitted", "published"].includes(session.status)) {
      throw new PublicError(
        "already_completed",
        "A completed upload cannot be cancelled.",
        409,
      );
    }

    await service.storage
      .from(session.storage_bucket)
      .remove([session.storage_path]);
    const { error: cancelError } = await service.rpc("fail_resource_upload", {
      target_session_id: sessionId,
      request_user_id: user.id,
      target_status: "cancelled",
      supplied_failure_code: "cancelled_by_user",
      validation_result: { cancelled: true },
    });
    if (cancelError) throw cancelError;
    return jsonResponse(request, { status: "cancelled" });
  } catch (error) {
    return errorResponse(request, error);
  }
});
