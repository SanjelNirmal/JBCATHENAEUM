import { serviceClient } from "./supabase.ts";

export type PushAudience =
  | { type: "everyone" }
  | { type: "program"; programId: string }
  | { type: "term"; termId: string }
  | { type: "subject"; subjectId: string }
  | { type: "users"; userIds: string[] };

export type PushJobPayload = {
  title: string;
  body: string;
  category: string;
  targetUrl: string;
  resourceId?: string;
  audience: PushAudience;
  initiatedBy?: string;
  reuseExistingNotification?: boolean;
};

type QueuePushJobInput = {
  idempotencyKey: string;
  resourceId?: string;
  payload: PushJobPayload;
  logContext: string;
};

/**
 * Queues an idempotent event notification and asks the protected sender to
 * process it. The service-role credential is supplied only between deployed
 * Edge Functions and is never returned to, or bundled into, the frontend.
 */
export async function queueAndDispatchPushJob(
  input: QueuePushJobInput,
): Promise<void> {
  const service = serviceClient();
  const { data: insertedJob, error: insertError } = await service
    .from("push_notification_jobs")
    .upsert(
      {
        resource_id: input.resourceId ?? null,
        idempotency_key: input.idempotencyKey,
        payload: input.payload,
        status: "queued",
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    )
    .select("id,status")
    .maybeSingle();

  if (insertError) {
    console.error(`${input.logContext}_queue_failed`, {
      code: insertError.code,
    });
    return;
  }

  let job = insertedJob;
  if (!job) {
    const existing = await service
      .from("push_notification_jobs")
      .select("id,status")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing.error) {
      console.error(`${input.logContext}_queue_lookup_failed`, {
        code: existing.error.code,
      });
      return;
    }
    job = existing.data;
  }

  if (!job || job.status !== "queued") return;

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceRoleKey) {
    console.error(`${input.logContext}_dispatch_not_configured`);
    return;
  }

  const response = await fetch(
    `${projectUrl}/functions/v1/send-push-notification`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ jobId: job.id }),
    },
  ).catch(() => null);

  if (!response?.ok) {
    console.error(`${input.logContext}_dispatch_deferred`, { jobId: job.id });
  }
}
