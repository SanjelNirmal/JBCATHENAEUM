const productionOrigins = [
  "https://jbc.nirmalsanjel.com.np",
  "https://jbcathenaeum.pages.dev",
];

const configuredOrigins = new Set([
  ...productionOrigins,
  ...(Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return productionOrigins[0];
  if (configuredOrigins.has(origin)) return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return null;
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = allowedOrigin(request);
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, x-cron-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function handleOptions(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export class PublicError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function errorResponse(request: Request, error: unknown): Response {
  if (error instanceof PublicError) {
    return jsonResponse(
      request,
      { error: error.code, message: error.message },
      error.status,
    );
  }
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code.slice(0, 80)
      : "unclassified";
  console.error("edge_function_error", { code: errorCode });
  return jsonResponse(
    request,
    { error: "internal_error", message: "The request could not be completed." },
    500,
  );
}
