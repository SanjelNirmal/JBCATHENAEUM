import { describe, expect, it } from "vitest";
import { canPermanentlyDeleteResource } from "../ResourceManagementPage";

describe("Super Admin resource deletion", () => {
  it("allows only the Super Admin role to receive the permanent-delete action", () => {
    expect(canPermanentlyDeleteResource("super_admin")).toBe(true);
    expect(canPermanentlyDeleteResource("admin")).toBe(false);
    expect(canPermanentlyDeleteResource("moderator")).toBe(false);
    expect(canPermanentlyDeleteResource(undefined)).toBe(false);
  });
});
