import { handleOptions } from "./http.ts";

function preflight(origin: string) {
  return handleOptions(
    new Request("https://project.supabase.co/functions/v1/test", {
      method: "OPTIONS",
      headers: { origin },
    }),
  );
}

Deno.test("production origins receive exact CORS authorization", () => {
  for (const origin of [
    "https://jbc.nirmalsanjel.com.np",
    "https://jbcathenaeum.pages.dev",
  ]) {
    const response = preflight(origin);
    if (response?.status !== 204) throw new Error("Preflight must return 204");
    if (response.headers.get("access-control-allow-origin") !== origin) {
      throw new Error(`Expected exact CORS origin for ${origin}`);
    }
  }
});

Deno.test("untrusted origins receive no CORS authorization", () => {
  const response = preflight("https://attacker.example");
  if (response?.status !== 204) throw new Error("Preflight must return 204");
  if (response.headers.has("access-control-allow-origin")) {
    throw new Error("Untrusted origin was authorized");
  }
});
