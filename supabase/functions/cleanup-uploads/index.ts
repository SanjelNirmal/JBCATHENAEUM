import { serviceClient } from "../_shared/supabase.ts";
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
    const expectedSecret = Deno.env.get("UPLOAD_CLEANUP_CRON_SECRET");
    if (
      !expectedSecret ||
      request.headers.get("x-cron-secret") !== expectedSecret
    ) {
      throw new PublicError("forbidden", "Cleanup authorization failed.", 403);
    }

    const service = serviceClient();
    const { data: expiredSessions, error } = await service
      .from("resource_upload_sessions")
      .select(
        "id,user_id,storage_bucket,storage_path,status,expires_at,failure_code",
      )
      .in("status", ["issued", "failed", "cancelled", "expired"])
      .lt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true })
      .limit(100);
    if (error) throw error;

    const { data: pendingSessions, error: pendingError } = await service
      .from("resource_upload_sessions")
      .select(
        "id,user_id,storage_bucket,storage_path,status,expires_at,failure_code",
      )
      .in("failure_code", [
        "quarantine_cleanup_pending",
        "review_cleanup_pending",
      ])
      .order("expires_at", { ascending: true })
      .limit(100);
    if (pendingError) throw pendingError;

    const sessions = Array.from(
      new Map(
        [...(expiredSessions ?? []), ...(pendingSessions ?? [])].map(
          (session) => [session.id, session],
        ),
      ).values(),
    ).slice(0, 100);

    let cleaned = 0;
    for (const session of sessions ?? []) {
      const { error: removeError } = await service.storage
        .from(session.storage_bucket)
        .remove([session.storage_path]);
      if (removeError) continue;

      if (session.status === "issued") {
        await service.rpc("fail_resource_upload", {
          target_session_id: session.id,
          request_user_id: session.user_id,
          target_status: "expired",
          supplied_failure_code: "session_expired",
          validation_result: { cleanup: true },
        });
      } else if (
        ["quarantine_cleanup_pending", "review_cleanup_pending"].includes(
          session.failure_code ?? "",
        )
      ) {
        await service
          .from("resource_upload_sessions")
          .update({ failure_code: null })
          .eq("id", session.id);
      }
      cleaned += 1;
    }

    const { data: deletionJobs, error: deletionError } = await service
      .from("resource_deletion_jobs")
      .select("id,storage_objects,attempts")
      .in("status", ["pending", "failed"])
      .lt("attempts", 10)
      .order("created_at")
      .limit(50);
    if (deletionError) throw deletionError;
    let deletionJobsCleaned = 0;
    for (const job of deletionJobs ?? []) {
      const objects = Array.isArray(job.storage_objects)
        ? job.storage_objects.filter(
            (item): item is { bucket: string; path: string } =>
              typeof item === "object" &&
              item !== null &&
              typeof item.bucket === "string" &&
              typeof item.path === "string",
          )
        : [];
      let failed = false;
      for (const bucket of [...new Set(objects.map((item) => item.bucket))]) {
        const paths = objects
          .filter((item) => item.bucket === bucket)
          .map((item) => item.path);
        const { error: removeError } = await service.storage
          .from(bucket)
          .remove(paths);
        if (removeError) failed = true;
      }
      await service
        .from("resource_deletion_jobs")
        .update({
          status: failed ? "failed" : "completed",
          attempts: job.attempts + 1,
          last_error: failed ? "storage_remove_failed" : null,
          completed_at: failed ? null : new Date().toISOString(),
        })
        .eq("id", job.id);
      if (!failed) deletionJobsCleaned += 1;
    }

    return jsonResponse(request, {
      inspected: sessions?.length ?? 0,
      cleaned,
      deletionJobsInspected: deletionJobs?.length ?? 0,
      deletionJobsCleaned,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
