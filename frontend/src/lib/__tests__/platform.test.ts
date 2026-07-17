import { describe, expect, it } from "vitest";
import {
  parseResourceFilters,
  serializeResourceFilters,
} from "../supabase/filters";
import { normalizePagination, pageCount } from "../supabase/pagination";
import { getErrorCode, toSafeErrorMessage } from "../supabase/errors";
import {
  getLegacyPreviewUrl,
  validateLegacyResourceUrl,
} from "../supabase/resources";

describe("resource filter URL state", () => {
  it("parses valid values and applies safe defaults", () => {
    const value = parseResourceFilters(
      new URLSearchParams(
        "q=computer+networks&page=2&pageSize=20&sort=popular",
      ),
    );
    expect(value).toMatchObject({
      q: "computer networks",
      page: 2,
      pageSize: 20,
      sort: "popular",
    });
  });

  it("drops invalid identifiers and bounded values", () => {
    const value = parseResourceFilters(
      new URLSearchParams("subject=not-a-uuid&page=-4&pageSize=500&year=1800"),
    );
    expect(value).toMatchObject({
      subject: undefined,
      page: 1,
      pageSize: 12,
      year: undefined,
    });
  });

  it("omits default values while retaining shareable filters", () => {
    const params = serializeResourceFilters({
      q: "economics",
      page: 1,
      pageSize: 12,
      sort: "recent",
      year: 2082,
    });
    expect(params.toString()).toBe("q=economics&year=2082");
  });
});

describe("pagination helpers", () => {
  it("normalizes invalid and excessive input", () => {
    expect(normalizePagination({ page: -1, pageSize: 500 })).toEqual({
      page: 1,
      pageSize: 50,
    });
    expect(normalizePagination({}, 20)).toEqual({ page: 1, pageSize: 20 });
  });

  it("always exposes at least one page", () => {
    expect(pageCount(0, 12)).toBe(1);
    expect(pageCount(25, 12)).toBe(3);
  });
});

describe("safe error mapping", () => {
  it("maps database codes without exposing server details", () => {
    const error = {
      code: "42501",
      message: "private table name and policy details",
    };
    expect(getErrorCode(error)).toBe("42501");
    expect(toSafeErrorMessage(error)).toBe(
      "You do not have permission to perform this action.",
    );
  });

  it("maps account and network states", () => {
    expect(
      toSafeErrorMessage(new Error("account_suspended"), "auth"),
    ).toContain("suspended");
    expect(toSafeErrorMessage(new Error("Failed to fetch"))).toContain(
      "network",
    );
  });
});

describe("legacy resource URL validation", () => {
  it("accepts only HTTPS Google document hosts", () => {
    expect(
      validateLegacyResourceUrl("https://drive.google.com/file/d/abc/view"),
    ).toContain("drive.google.com");
    expect(
      validateLegacyResourceUrl("http://drive.google.com/file/d/abc/view"),
    ).toBeNull();
    expect(
      validateLegacyResourceUrl("https://evil.example/file.pdf"),
    ).toBeNull();
    expect(validateLegacyResourceUrl("javascript:alert(1)")).toBeNull();
  });

  it("converts supported Drive view URLs to previews", () => {
    expect(
      getLegacyPreviewUrl("https://drive.google.com/file/d/abc/view"),
    ).toBe("https://drive.google.com/file/d/abc/preview");
  });
});
