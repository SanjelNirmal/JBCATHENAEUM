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
    await requireAal2(client, request);
    const { resourceId, confirmation } = await request.json();
    if (!resourceId || confirmation !== `DELETE ${resourceId}`) {
      throw new PublicError(
        "confirmation_required",
        "The permanent-deletion confirmation did not match.",
      );
    }
    const service = serviceClient();
    const { data: role } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!role)
      throw new PublicError(
        "forbidden",
        "Super administrator role is required.",
        403,
      );

    const { data: resource, error: resourceError } = await service
      .from("resources")
      .select("status,archived_at")
      .eq("id", resourceId)
      .single();
    if (resourceError || !resource)
      throw new PublicError("not_found", "Resource was not found.", 404);
    if (
      resource.status !== "archived" ||
      !resource.archived_at ||
      new Date(resource.archived_at).getTime() > Date.now() - 90 * 86_400_000
    ) {
      throw new PublicError(
        "retention_required",
        "The 90-day archived retention period has not elapsed.",
        409,
      );
    }
    const { data: versions, error: versionError } = await service
      .from("resource_versions")
      .select("storage_bucket,storage_path")
      .eq("resource_id", resourceId);
    if (versionError) throw versionError;
    const objects = (versions ?? []).flatMap((version) =>
      !version.storage_bucket ||
      !version.storage_path ||
      version.storage_bucket === "legacy-external"
        ? []
        : [{ bucket: version.storage_bucket, path: version.storage_path }],
    );
    const { data: jobId, error: deleteError } = await service.rpc(
      "permanently_delete_resource",
      {
        target_resource_id: resourceId,
        actor_user_id: user.id,
        supplied_storage_objects: objects,
      },
    );
    if (deleteError) throw deleteError;

    let cleanupPending = false;
    for (const bucket of [...new Set(objects.map((item) => item.bucket))]) {
      const paths = objects
        .filter((item) => item.bucket === bucket)
        .map((item) => item.path);
      const { error } = await service.storage.from(bucket).remove(paths);
      if (error) cleanupPending = true;
    }
    await service
      .from("resource_deletion_jobs")
      .update({
        status: cleanupPending ? "failed" : "completed",
        attempts: 1,
        last_error: cleanupPending ? "storage_remove_failed" : null,
        completed_at: cleanupPending ? null : new Date().toISOString(),
      })
      .eq("id", jobId);
    return jsonResponse(
      request,
      { status: "deleted", cleanupPending },
      cleanupPending ? 202 : 200,
    );
  } catch (error) {
    return errorResponse(request, error);
  }
});
