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
    const { user, client: userSupabase } = await authenticatedUser(request);
    await requireAal2(userSupabase);
    const { resourceId } = await request.json();
    if (!resourceId)
      throw new PublicError("invalid_resource", "Resource is required.");

    const service = serviceClient();
    const { data: roleRows, error: roleError } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);
    if (roleError || !roleRows?.length)
      throw new PublicError(
        "forbidden",
        "Administrator role is required.",
        403,
      );

    const { data: resource, error: resourceError } = await service
      .from("resources")
      .select("id,campus_id,subject_id,status,current_version_id")
      .eq("id", resourceId)
      .single();
    if (resourceError || !resource)
      throw new PublicError("not_found", "Resource was not found.", 404);
    if (resource.status === "published")
      return jsonResponse(request, { status: "published", idempotent: true });
    if (resource.status !== "approved")
      throw new PublicError(
        "invalid_state",
        "Only approved resources can be published.",
        409,
      );

    const { data: review, error: reviewError } = await service
      .from("resource_reviews")
      .select("published_version_id")
      .eq("resource_id", resourceId)
      .eq("decision", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (reviewError || !review?.published_version_id) {
      throw new PublicError(
        "approved_version_missing",
        "Approved resource version is missing.",
        409,
      );
    }

    const { data: version, error: versionError } = await service
      .from("resource_versions")
      .select("id,storage_bucket,storage_path,scan_status")
      .eq("id", review.published_version_id)
      .eq("resource_id", resourceId)
      .single();
    if (versionError || !version)
      throw new PublicError(
        "version_missing",
        "Resource version was not found.",
        404,
      );
    if (
      version.storage_bucket !== "resource-quarantine" ||
      version.scan_status !== "clean"
    ) {
      throw new PublicError(
        "scan_required",
        "Only a clean quarantined PDF can be published.",
        409,
      );
    }

    const destinationPath = `${resource.campus_id}/${resource.subject_id}/${resource.id}/${version.id}.pdf`;
    await service.storage.from("resource-published").remove([destinationPath]);
    const { error: copyError } = await service.storage
      .from("resource-quarantine")
      .copy(version.storage_path, destinationPath, {
        destinationBucket: "resource-published",
      });
    if (copyError) throw copyError;

    const { error: updateVersionError } = await service
      .from("resource_versions")
      .update({
        storage_bucket: "resource-published",
        storage_path: destinationPath,
      })
      .eq("id", version.id);
    if (updateVersionError) {
      await service.storage
        .from("resource-published")
        .remove([destinationPath]);
      throw updateVersionError;
    }

    const { error: publishError } = await userSupabase.rpc("publish_resource", {
      target_resource_id: resourceId,
    });
    if (publishError) {
      await service
        .from("resource_versions")
        .update({
          storage_bucket: "resource-quarantine",
          storage_path: version.storage_path,
        })
        .eq("id", version.id);
      await service.storage
        .from("resource-published")
        .remove([destinationPath]);
      throw publishError;
    }

    const { error: removeError } = await service.storage
      .from("resource-quarantine")
      .remove([version.storage_path]);
    await service
      .from("resource_upload_sessions")
      .update({
        status: "published",
        promoted_at: new Date().toISOString(),
        failure_code: removeError ? "quarantine_cleanup_pending" : null,
      })
      .eq("version_id", version.id);

    return jsonResponse(request, {
      status: "published",
      cleanupPending: Boolean(removeError),
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
