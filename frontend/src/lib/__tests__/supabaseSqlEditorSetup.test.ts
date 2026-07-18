import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "../../../..");
const setupDirectory = resolve(repositoryRoot, "supabase/sql_editor_setup");

const migrationCopies = [
  [
    "202607170001_stage1_security.sql",
    "01_core_security_profiles_and_roles.sql",
  ],
  [
    "202607170002_phase2_academic_resources.sql",
    "02_academic_structure_and_resources.sql",
  ],
  [
    "202607170003_phase2_workflows.sql",
    "03_submissions_reviews_and_notifications.sql",
  ],
  [
    "202607170004_phase3_private_storage.sql",
    "04_private_pdf_storage_and_uploads.sql",
  ],
  [
    "202607170005_platform_completion.sql",
    "05_search_admin_accounts_and_analytics.sql",
  ],
  [
    "202607170006_academic_catalog_seed.sql",
    "06_jbc_academic_catalog_seed.sql",
  ],
  ["202607170007_admin_resource_listing.sql", "07_admin_resource_listing.sql"],
  ["202607170008_review_queue_listing.sql", "08_moderator_review_queue.sql"],
  [
    "202607170009_review_queue_scan_status.sql",
    "09_review_queue_scan_status_fix.sql",
  ],
  [
    "202607180010_rejected_review_history.sql",
    "10_rejected_upload_review_history.sql",
  ],
  [
    "202607180011_account_engagement_pwa_foundation.sql",
    "11_bookmarks_ratings_devices_and_preferences.sql",
  ],
  [
    "202607180012_public_engagement_profiles.sql",
    "12_public_profiles_and_rating_actions.sql",
  ],
  [
    "202607180012_upload_policy_acceptance.sql",
    "13_upload_policy_acceptance.sql",
  ],
  [
    "202607180013_contributor_received_ratings.sql",
    "14_contributor_received_rating_calculation.sql",
  ],
  ["202607180014_manual_pdf_review_only.sql", "15_manual_pdf_review_only.sql"],
  [
    "202607180015_super_admin_resource_deletion.sql",
    "16_super_admin_resource_deletion.sql",
  ],
  ["202607180016_bca_old_new_curricula.sql", "17_bca_old_new_curricula.sql"],
] as const;

describe("Supabase SQL Editor setup package", () => {
  it("provides the complete, clearly numbered execution sequence", () => {
    const sqlFiles = readdirSync(setupDirectory)
      .filter((name) => name.endsWith(".sql"))
      .sort();
    expect(sqlFiles).toEqual([
      ...migrationCopies.map(([, friendlyName]) => friendlyName),
      "90_create_first_super_admin.sql",
      "99_verify_new_project.sql",
    ]);
  });

  it("keeps files 01 through 17 identical to the reviewed migrations", () => {
    for (const [migrationName, friendlyName] of migrationCopies) {
      expect(
        readFileSync(resolve(setupDirectory, friendlyName), "utf8"),
        `${friendlyName} must match ${migrationName}`,
      ).toBe(
        readFileSync(
          resolve(repositoryRoot, "supabase/migrations", migrationName),
          "utf8",
        ),
      );
    }
  });

  it("keeps owner bootstrap explicit and verifies the finished schema", () => {
    const admin = readFileSync(
      resolve(setupDirectory, "90_create_first_super_admin.sql"),
      "utf8",
    );
    const verification = readFileSync(
      resolve(setupDirectory, "99_verify_new_project.sql"),
      "utf8",
    );
    expect(admin).toContain("OWNER_EMAIL_HERE");
    expect(admin).toContain("super_admin");
    expect(verification).toContain("28 tables");
    expect(verification).toContain("get_public_contributor_profile");
    expect(verification).toContain("upload_policy_version");
    expect(verification).toContain("mark_manually_approved_version");
    expect(verification).toContain("immediate_deletion");
    expect(verification).toContain("old-bca-syllabus");
    expect(verification).toContain("new-project verification passed");
  });
});
