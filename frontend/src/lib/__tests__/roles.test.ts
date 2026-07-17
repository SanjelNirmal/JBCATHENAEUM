import { describe, expect, it } from "vitest";
import {
  canReviewResources,
  isAdminRole,
  isAppRole,
  resolveEffectiveRole,
} from "../roles";

describe("role helpers", () => {
  it("rejects legacy and unknown role values", () => {
    expect(isAppRole("scholar")).toBe(false);
    expect(isAppRole("owner")).toBe(false);
  });

  it("uses student as the least-privilege fallback", () => {
    expect(resolveEffectiveRole([])).toBe("student");
  });

  it("selects the highest assigned membership", () => {
    expect(resolveEffectiveRole(["student", "moderator", "faculty"])).toBe(
      "moderator",
    );
  });

  it("only treats admin memberships as dashboard administrators", () => {
    expect(isAdminRole("moderator")).toBe(false);
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
  });

  it("allows moderators into the review workflow without admin privileges", () => {
    expect(canReviewResources("faculty")).toBe(false);
    expect(canReviewResources("moderator")).toBe(true);
    expect(canReviewResources("admin")).toBe(true);
  });
});
