import { describe, expect, it } from "vitest";
import {
  slugifyAcademicPost,
  validateAcademicPostCover,
  validateAcademicPostDriveUrl,
} from "../academicPosts";
import { canManageAcademicPosts } from "../../roles";

describe("academic post validation", () => {
  it("normalizes slugs and accepts only HTTPS Google Drive destinations", () => {
    expect(slugifyAcademicPost("  DBMS Notes 2083! ")).toBe("dbms-notes-2083");
    expect(
      validateAcademicPostDriveUrl(
        "https://drive.google.com/drive/folders/real",
      ),
    ).toContain("drive.google.com");
    expect(validateAcademicPostDriveUrl("")).toBeNull();
    expect(() =>
      validateAcademicPostDriveUrl("https://example.com/file"),
    ).toThrow();
  });

  it("validates cover MIME types and file sizes", () => {
    expect(() =>
      validateAcademicPostCover(
        new File(["image"], "cover.webp", { type: "image/webp" }),
      ),
    ).not.toThrow();
    expect(() =>
      validateAcademicPostCover(
        new File(["file"], "cover.svg", { type: "image/svg+xml" }),
      ),
    ).toThrow("JPEG, PNG, or WebP");
  });
});

describe("academic post role access", () => {
  it("uses existing trusted roles without granting students CMS access", () => {
    expect(canManageAcademicPosts("faculty")).toBe(true);
    expect(canManageAcademicPosts("moderator")).toBe(true);
    expect(canManageAcademicPosts("admin")).toBe(true);
    expect(canManageAcademicPosts("super_admin")).toBe(true);
    expect(canManageAcademicPosts("student")).toBe(false);
    expect(canManageAcademicPosts("contributor")).toBe(false);
  });
});
