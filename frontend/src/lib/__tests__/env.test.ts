import { describe, expect, it } from "vitest";
import { validatePublicEnvironment } from "../env";

describe("public environment validation", () => {
  it("reports both missing required variables without exposing values", () => {
    const result = validatePublicEnvironment({});
    expect(result.issues.map((issue) => issue.variable)).toEqual([
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
    ]);
  });

  it("rejects an insecure production URL", () => {
    const result = validatePublicEnvironment({
      VITE_SUPABASE_URL: "http://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "public-key",
    });
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].variable).toBe("VITE_SUPABASE_URL");
  });

  it("accepts a complete public configuration", () => {
    const result = validatePublicEnvironment({
      VITE_SUPABASE_URL: "https://project.supabase.co",
      VITE_SUPABASE_ANON_KEY: "public-key",
    });
    expect(result.issues).toEqual([]);
  });
});
