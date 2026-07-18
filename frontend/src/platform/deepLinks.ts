const CUSTOM_SCHEME = "jbcathenaeum:";
const TRUSTED_WEB_HOST = "jbc.nirmalsanjel.com.np";
const RESOURCE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CALLBACK_VALUE = /^[A-Za-z0-9._~+/=-]{1,2048}$/;
const ORDER_REFERENCE = /^[A-Za-z0-9._-]{1,160}$/;

export type DeepLinkKind =
  "auth-callback" | "payment-return" | "resource" | "notifications";

export interface DeepLinkDestination {
  kind: DeepLinkKind;
  route: string;
  replace: boolean;
}

const authQueryKeys = new Set([
  "code",
  "error",
  "error_code",
  "error_description",
  "type",
  "next",
]);
const paymentQueryKeys = new Set([
  "provider",
  "order",
  "order_id",
  "reference",
]);

export function safeAuthNext(value: string | null): string {
  if (!value) return "/";
  if (value === "/" || value === "/login?verified=1") return value;
  if (value === "/reset-password") return value;
  if (/^\/resources\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return value;
  return "/";
}

function copyAllowedQuery(
  source: URLSearchParams,
  allowedKeys: Set<string>,
  validator: (key: string, value: string) => boolean,
): string {
  const result = new URLSearchParams();
  for (const [key, value] of source) {
    if (!allowedKeys.has(key) || result.has(key) || !validator(key, value)) {
      continue;
    }
    result.set(key, value);
  }
  const query = result.toString();
  return query ? `?${query}` : "";
}

function authQuery(source: URLSearchParams): string {
  return copyAllowedQuery(source, authQueryKeys, (key, value) => {
    if (key === "next") return safeAuthNext(value) === value;
    if (key === "type")
      return ["signup", "recovery", "magiclink", "oauth"].includes(value);
    if (key === "error_description") return value.length <= 300;
    if (key === "error" || key === "error_code")
      return /^[a-z0-9_ -]{1,120}$/i.test(value);
    return CALLBACK_VALUE.test(value);
  });
}

function paymentQuery(source: URLSearchParams): string {
  return copyAllowedQuery(source, paymentQueryKeys, (key, value) => {
    if (key === "provider") return ["esewa", "khalti"].includes(value);
    return ORDER_REFERENCE.test(value);
  });
}

function customParts(url: URL): { group: string; rest: string } {
  return { group: url.hostname.toLowerCase(), rest: url.pathname };
}

function httpsParts(url: URL): { group: string; rest: string } | null {
  const match = url.pathname.match(
    /^\/(auth|payment|resources|account)(\/.*)?$/,
  );
  return match ? { group: match[1], rest: match[2] || "/" } : null;
}

/**
 * Converts only explicitly supported custom/HTTPS links into internal routes.
 * It never returns user-supplied URLs or arbitrary router destinations.
 */
export function parseDeepLink(value: string): DeepLinkDestination | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.username || url.password || url.hash) return null;

  const isCustom = url.protocol === CUSTOM_SCHEME;
  const isTrustedHttps =
    url.protocol === "https:" &&
    url.hostname.toLowerCase() === TRUSTED_WEB_HOST &&
    !url.port;
  if (!isCustom && !isTrustedHttps) return null;

  const parts = isCustom ? customParts(url) : httpsParts(url);
  if (!parts) return null;

  if (parts.group === "auth" && parts.rest === "/callback") {
    return {
      kind: "auth-callback",
      route: `/auth/callback${authQuery(url.searchParams)}`,
      replace: true,
    };
  }
  if (parts.group === "payment" && parts.rest === "/return") {
    return {
      kind: "payment-return",
      route: `/payment/return${paymentQuery(url.searchParams)}`,
      replace: true,
    };
  }
  if (parts.group === "resources") {
    const slug = parts.rest.replace(/^\//, "");
    if (!RESOURCE_SLUG.test(slug) || slug.length > 180) return null;
    return {
      kind: "resource",
      route: `/resources/${slug}`,
      replace: false,
    };
  }
  if (parts.group === "account" && parts.rest === "/notifications") {
    return { kind: "notifications", route: "/notifications", replace: false };
  }
  return null;
}

export function nativeAuthCallbackUrl(
  next: string,
  type: "signup" | "recovery" | "magiclink" | "oauth",
): string {
  const url = new URL("jbcathenaeum://auth/callback");
  url.searchParams.set("next", safeAuthNext(next));
  url.searchParams.set("type", type);
  return url.toString();
}
