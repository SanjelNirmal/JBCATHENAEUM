import { describe, expect, it } from "vitest";
import {
  nativeAuthCallbackUrl,
  parseDeepLink,
  safeAuthNext,
} from "../deepLinks";

describe("native deep links", () => {
  it("maps only the supported custom-scheme destinations", () => {
    expect(parseDeepLink("jbcathenaeum://resources/network-security")).toEqual({
      kind: "resource",
      route: "/resources/network-security",
      replace: false,
    });
    expect(parseDeepLink("jbcathenaeum://account/notifications")).toEqual({
      kind: "notifications",
      route: "/notifications",
      replace: false,
    });
  });

  it("supports trusted HTTPS equivalents and rejects lookalike hosts", () => {
    expect(
      parseDeepLink(
        "https://jbc.nirmalsanjel.com.np/resources/network-security",
      )?.route,
    ).toBe("/resources/network-security");
    expect(
      parseDeepLink(
        "https://jbc.nirmalsanjel.com.np.evil.example/resources/network-security",
      ),
    ).toBeNull();
  });

  it("rejects dangerous schemes, fragments, credentials, and arbitrary routes", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,pwned",
      "file:///private/file",
      "jbcathenaeum://resources/good#access_token=secret",
      "https://user:pass@jbc.nirmalsanjel.com.np/resources/good",
      "jbcathenaeum://admin/users",
      "jbcathenaeum://resources/not/one-slug",
    ]) {
      expect(parseDeepLink(value)).toBeNull();
    }
  });

  it("keeps only allowlisted callback values and safe next routes", () => {
    const destination = parseDeepLink(
      "jbcathenaeum://auth/callback?code=abc_123&next=%2Freset-password&redirect=https%3A%2F%2Fevil.example",
    );
    expect(destination?.route).toBe(
      "/auth/callback?code=abc_123&next=%2Freset-password",
    );
    expect(safeAuthNext("//evil.example")).toBe("/");
  });

  it("creates a bounded PKCE callback URL without arbitrary redirects", () => {
    expect(nativeAuthCallbackUrl("//evil.example", "oauth")).toBe(
      "jbcathenaeum://auth/callback?next=%2F&type=oauth",
    );
  });

  it("treats payment return values as navigation input only", () => {
    expect(
      parseDeepLink(
        "jbcathenaeum://payment/return?provider=khalti&order=order-123&paid=true&amount=999",
      )?.route,
    ).toBe("/payment/return?provider=khalti&order=order-123");
  });
});
