import {
  anonymousClient,
  authenticatedUser,
  serviceClient,
} from "../_shared/supabase.ts";
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
    const wantsJson = url.searchParams.get("format") === "json";
    const recordOpen = url.searchParams.get("open") === "1";
    if (!resourceId)
      throw new PublicError("invalid_resource", "Resource is required.");

    let resourceClient = anonymousClient();
    let eventUserId: string | null = null;
    if (request.headers.get("authorization")) {
      try {
        const authenticated = await authenticatedUser(request);
        resourceClient = authenticated.client;
        eventUserId = authenticated.user.id;
      } catch {
        // Public resources remain accessible when an optional stale session is
        // present. Invalid credentials are never trusted for history records.
      }
    }
    const { data: resource, error: resourceError } = await resourceClient
      .from("resources")
      .select("id,current_version_id,file_url")
      .eq("id", resourceId)
      .single();
    if (resourceError || !resource) {
      throw new PublicError(
        "not_found",
        "Published resource was not found.",
        404,
      );
    }

    const service = serviceClient();
    if (!resource.current_version_id) {
      let legacyUrl: URL;
      try {
        legacyUrl = new URL(String(resource.file_url ?? ""));
      } catch {
        throw new PublicError(
          "not_available",
          "The verified file is not available.",
          404,
        );
      }
      if (
        legacyUrl.protocol !== "https:" ||
        !["drive.google.com", "docs.google.com"].includes(legacyUrl.hostname)
      ) {
        throw new PublicError(
          "not_available",
          "The verified file is not available.",
          404,
        );
      }
      if (recordOpen) {
        const { error: recordError } = await service.rpc(
          "record_resource_download",
          {
            target_resource_id: resourceId,
            event_user_id: eventUserId,
            target_version_id: null,
          },
        );
        if (recordError)
          console.error("download_history_write_failed", {
            code: recordError.code,
          });
      }
      if (!wantsJson) {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders(request),
            Location: legacyUrl.toString(),
            "Cache-Control": "private, no-store, max-age=0",
            "Referrer-Policy": "no-referrer",
          },
        });
      }
      const { data: countedResource } = await service
        .from("resources")
        .select("download_count")
        .eq("id", resourceId)
        .single();
      return jsonResponse(request, {
        viewerUrl: legacyUrl.toString(),
        downloadCount: Number(countedResource?.download_count ?? 0),
      });
    }

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

    if (download || recordOpen) {
      const { error: recordError } = await service.rpc(
        "record_resource_download",
        {
          target_resource_id: resourceId,
          event_user_id: eventUserId,
          target_version_id: resource.current_version_id,
        },
      );
      if (recordError)
        console.error("download_history_write_failed", {
          code: recordError.code,
        });
    }
    if (wantsJson) {
      const { data: countedResource } = await service
        .from("resources")
        .select("download_count")
        .eq("id", resourceId)
        .single();
      return jsonResponse(request, {
        viewerUrl: signed.signedUrl,
        downloadCount: Number(countedResource?.download_count ?? 0),
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
