import { anonymousClient, serviceClient } from "../_shared/supabase.ts";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "GET")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const url = new URL(request.url);
    const resourceId = url.searchParams.get("resourceId");
    if (!resourceId)
      throw new PublicError("invalid_resource", "Resource is required.");

    const publicSupabase = anonymousClient();
    const { data: resource, error: resourceError } = await publicSupabase
      .from("resources")
      .select("id,current_version_id")
      .eq("id", resourceId)
      .single();
    if (resourceError || !resource?.current_version_id) {
      throw new PublicError(
        "not_found",
        "Published resource was not found.",
        404,
      );
    }

    const service = serviceClient();
    const { data: version, error: versionError } = await service
      .from("resource_versions")
      .select("storage_bucket,storage_path,safe_filename,scan_status")
      .eq("id", resource.current_version_id)
      .eq("resource_id", resourceId)
      .single();
    if (
      versionError ||
      !version ||
      version.storage_bucket !== "resource-published" ||
      version.scan_status !== "clean"
    ) {
      throw new PublicError(
        "not_available",
        "The verified file is not available.",
        404,
      );
    }

    const { data: settings } = await service
      .from("storage_settings")
      .select("signed_download_seconds")
      .eq("singleton", true)
      .single();
    const expiresIn = Number(settings?.signed_download_seconds ?? 300);
    const download = url.searchParams.get("download") === "1";
    const { data: signed, error: signedError } = await service.storage
      .from(version.storage_bucket)
      .createSignedUrl(
        version.storage_path,
        expiresIn,
        download ? { download: version.safe_filename } : undefined,
      );
    if (signedError || !signed)
      throw signedError ?? new Error("Signed URL was not created");

    if (download) {
      await service.rpc("increment_resource_download", {
        target_resource_id: resourceId,
      });
    }
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders(request),
        Location: signed.signedUrl,
        "Cache-Control": "private, no-store, max-age=0",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
