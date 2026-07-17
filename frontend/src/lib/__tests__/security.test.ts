import { describe, expect, it, vi } from "vitest";
import { validatePublicEnvironment } from "../env";
import { recordClientError } from "../monitoring";

describe("browser credential boundaries", () => {
  it("does not copy private environment variables into public configuration", () => {
    const privateValue = "private-value-that-must-not-reach-the-browser";
    const result = validatePublicEnvironment({
      VITE_SUPABASE_URL: "https://project.supabase.co",
      VITE_SUPABASE_ANON_KEY: "publishable-key",
      SUPABASE_SERVICE_ROLE_KEY: privateValue,
      SUPABASE_ACCESS_TOKEN: privateValue,
    });

    expect(result.issues).toEqual([]);
    expect(JSON.stringify(result)).not.toContain(privateValue);
    expect(Object.keys(result.config)).not.toContain(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  });

  it("never writes a raw bearer token from an error to monitoring or console", () => {
    const credential = "Bearer header.payload.signature";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    let captured: unknown;
    const capture = (event: Event) => {
      captured = (event as CustomEvent).detail;
    };
    window.addEventListener("jbc:client-error", capture, { once: true });

    try {
      recordClientError(
        "error",
        new Error(`Request rejected with ${credential}`),
      );
      const emitted = JSON.stringify({
        captured,
        calls: consoleError.mock.calls,
      });
      expect(emitted).not.toContain(credential);
      expect(captured).toMatchObject({ message: "unexpected_client_failure" });
    } finally {
      window.removeEventListener("jbc:client-error", capture);
      consoleError.mockRestore();
    }
  });
});
