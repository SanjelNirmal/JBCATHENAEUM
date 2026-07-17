import type { SupabaseClient } from "npm:@supabase/supabase-js@2.105.4";
import { PublicError } from "./http.ts";
import { requireAal2 } from "./supabase.ts";

function request(token?: string) {
  return new Request("https://project.supabase.co/functions/v1/test", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function clientAt(level: "aal1" | "aal2") {
  let receivedToken = "";
  const client = {
    auth: {
      mfa: {
        getAuthenticatorAssuranceLevel: (token: string) => {
          receivedToken = token;
          return Promise.resolve({
            data: {
              currentLevel: level,
              nextLevel: level,
              currentAuthenticationMethods: [],
            },
            error: null,
          });
        },
      },
    },
  } as unknown as SupabaseClient;
  return { client, receivedToken: () => receivedToken };
}

Deno.test("Edge MFA validation passes the explicit bearer token", async () => {
  const fake = clientAt("aal2");
  await requireAal2(fake.client, request("verified-aal2-token"));
  if (fake.receivedToken() !== "verified-aal2-token") {
    throw new Error("The bearer token was not passed to the MFA verifier");
  }
});

Deno.test("Edge MFA validation rejects a lower assurance token", async () => {
  const fake = clientAt("aal1");
  try {
    await requireAal2(fake.client, request("aal1-token"));
    throw new Error("AAL1 token was accepted");
  } catch (error) {
    if (!(error instanceof PublicError) || error.code !== "mfa_required") {
      throw error;
    }
  }
});

Deno.test("Edge MFA validation requires a bearer token", async () => {
  const fake = clientAt("aal2");
  try {
    await requireAal2(fake.client, request());
    throw new Error("Missing bearer token was accepted");
  } catch (error) {
    if (
      !(error instanceof PublicError) ||
      error.code !== "authentication_required"
    ) {
      throw error;
    }
  }
});
