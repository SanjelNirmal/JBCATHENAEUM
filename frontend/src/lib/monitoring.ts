import { publicEnvironment } from "./env";

export interface SanitizedClientError {
  kind: "error" | "unhandled_rejection" | "route_error";
  message: string;
  path: string;
  version: string;
  occurredAt: string;
}

function safeMessage(value: unknown): string {
  if (typeof value === "object" && value && "code" in value) {
    const code = String(value.code);
    if (/^[a-z0-9_-]{1,64}$/i.test(code)) return `code:${code}`;
  }
  const text = value instanceof Error ? value.message : String(value ?? "");
  if (/abort/i.test(text)) return "request_aborted";
  if (/network|failed to fetch|load failed/i.test(text))
    return "network_failure";
  if (/chunk/i.test(text)) return "chunk_load_failure";
  return "unexpected_client_failure";
}

export function recordClientError(
  kind: SanitizedClientError["kind"],
  value: unknown,
) {
  const event: SanitizedClientError = {
    kind,
    message: safeMessage(value),
    path: window.location.pathname,
    version: publicEnvironment.config.appVersion,
    occurredAt: new Date().toISOString(),
  };
  window.dispatchEvent(new CustomEvent("jbc:client-error", { detail: event }));
  console.error("JBC Athenaeum client error", event);
}

export function initializeClientMonitoring() {
  window.addEventListener("error", (event) =>
    recordClientError("error", event.error ?? event.message),
  );
  window.addEventListener("unhandledrejection", (event) =>
    recordClientError("unhandled_rejection", event.reason),
  );
}
