import {
  createClient,
  type SupabaseClient,
  type User,
} from "npm:@supabase/supabase-js@2.105.4";
import { PublicError } from "./http.ts";

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function serviceClient(): SupabaseClient {
  return createClient(
    requiredEnvironment("SUPABASE_URL"),
    requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function anonymousClient(): SupabaseClient {
  return createClient(
    requiredEnvironment("SUPABASE_URL"),
    requiredEnvironment("SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function userClient(request: Request): SupabaseClient {
  const authorization = request.headers.get("authorization");
  if (!authorization)
    throw new PublicError(
      "authentication_required",
      "Please sign in to continue.",
      401,
    );
  return createClient(
    requiredEnvironment("SUPABASE_URL"),
    requiredEnvironment("SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export async function authenticatedUser(
  request: Request,
): Promise<{ user: User; client: SupabaseClient }> {
  const client = userClient(request);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new PublicError(
      "authentication_required",
      "Your session is invalid or expired.",
      401,
    );
  }
  const { data: profile } = await client
    .from("profiles")
    .select("account_status")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.account_status && profile.account_status !== "active") {
    throw new PublicError(
      "account_unavailable",
      "This account is not active.",
      403,
    );
  }
  return { user: data.user, client };
}

export async function requireAal2(
  client: SupabaseClient,
  request: Request,
): Promise<void> {
  const authorization = request.headers.get("authorization") ?? "";
  const accessToken = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    throw new PublicError(
      "authentication_required",
      "Your session is invalid or expired.",
      401,
    );
  }
  const { data, error } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel(accessToken);
  if (error || data.currentLevel !== "aal2") {
    throw new PublicError(
      "mfa_required",
      "Multi-factor authentication is required.",
      403,
    );
  }
}
