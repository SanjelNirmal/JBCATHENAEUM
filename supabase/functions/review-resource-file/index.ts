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

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { user, client } = await authenticatedUser(request);
    await requireAal2(client);
    const { versionId } = await request.json();
    if (!versionId)
      throw new PublicError("invalid_version", "Resource version is required.");

    const service = serviceClient();
    const { data: roles, error: roleError } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["moderator", "admin", "super_admin"]);
    if (roleError || !roles?.length)
      throw new PublicError("forbidden", "Review role is required.", 403);

    const { data: version, error: versionError } = await service
      .from("resource_versions")
      .select("storage_bucket,storage_path,scan_status")
      .eq("id", versionId)
      .single();
    if (
      versionError ||
      !version ||
      version.storage_bucket !== "resource-quarantine" ||
      version.scan_status !== "clean"
    ) {
      throw new PublicError(
        "not_available",
        "Validated quarantine file was not found.",
        404,
      );
    }

    const { data: signed, error: signedError } = await service.storage
      .from(version.storage_bucket)
      .createSignedUrl(version.storage_path, 300);
    if (signedError || !signed)
      throw signedError ?? new Error("Review URL was not created");
    return jsonResponse(request, {
      signedUrl: signed.signedUrl,
      expiresIn: 300,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
