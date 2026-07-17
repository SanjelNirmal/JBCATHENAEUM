import { serviceClient } from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

const emailPattern = /^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$/i;

function textValue(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);
  try {
    const body = await request.json();
    const name = textValue(body.name, 120);
    const email = textValue(body.email, 254).toLowerCase();
    const relationship = textValue(body.relationship, 120);
    const reason = textValue(body.reason, 200);
    const details = textValue(body.details, 5000);
    const evidenceUrl = textValue(body.evidenceUrl, 1000);
    const resourceId = textValue(body.resourceId, 36) || null;
    if (
      name.length < 2 ||
      !emailPattern.test(email) ||
      relationship.length < 3 ||
      reason.length < 3 ||
      details.length < 20
    ) {
      throw new PublicError(
        "invalid_request",
        "Complete the required removal-request fields.",
      );
    }
    if (evidenceUrl) {
      const parsed = new URL(evidenceUrl);
      if (parsed.protocol !== "https:")
        throw new PublicError(
          "invalid_evidence",
          "Evidence links must use HTTPS.",
        );
    }

    const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
    if (turnstileSecret) {
      const token = textValue(body.turnstileToken, 2048);
      const verification = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: token,
          }),
        },
      );
      const result = await verification.json();
      if (!result.success)
        throw new PublicError(
          "bot_check_failed",
          "Bot verification failed.",
          403,
        );
    }

    const salt = Deno.env.get("RATE_LIMIT_HASH_SALT");
    if (!salt) throw new Error("RATE_LIMIT_HASH_SALT is not configured");
    const clientAddress = request.headers.get("cf-connecting-ip") ?? "unknown";
    const ipHash = await sha256(`${salt}:${clientAddress}`);
    const service = serviceClient();
    const { data, error } = await service.rpc(
      "create_content_removal_request",
      {
        target_resource_id: resourceId,
        supplied_name: name,
        supplied_email: email,
        supplied_relationship: relationship,
        supplied_reason: reason,
        supplied_details: details,
        supplied_evidence_url: evidenceUrl || null,
        supplied_ip_hash: ipHash,
      },
    );
    if (error) throw error;
    return jsonResponse(request, { requestId: data }, 201);
  } catch (error) {
    return errorResponse(request, error);
  }
});
