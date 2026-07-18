# JBC Athenaeum clean reinstall

> Setting up a brand-new Supabase account? Do not use this destructive
> reinstall procedure. Follow the simpler numbered SQL Editor guide in
> [`../sql_editor_setup/README.md`](../sql_editor_setup/README.md).

This procedure intentionally deletes every application object and row in the
`public` schema. It preserves Supabase-managed Auth users and the `auth`,
`storage`, `realtime`, `vault`, `extensions`, and migration-history schemas.

The numbered SQL Editor files in `../sql_editor_setup` are the complete
application install for a clean database. Together they install 28 public
tables, all columns and constraints, enums, indexes, triggers, RLS policies,
grants, RPC functions, private Storage bucket configuration, Upload Policy
acceptance, manual PDF review, Super Admin permanent deletion, and both old and
new BCA syllabus catalogs. They do not insert resources, submissions, reports,
analytics events, or other mock content.

## Before starting

1. Confirm you are in the correct Supabase project before running any SQL.
2. Because data loss is intended, delete the `resource-quarantine` and
   `resource-published` buckets through the Supabase Storage dashboard first if
   they contain files. Deleting Storage rows directly with SQL can orphan the
   underlying objects.
3. Keep `auth.users`. Deleting Supabase Auth tables would break login and is not
   part of this reinstall.

## Reinstall

1. Run `00_reset_public_schema.sql` once in the Supabase SQL Editor.
2. Run the numbered setup files from `../sql_editor_setup` in exact order:

   ```text
   01_core_security_profiles_and_roles.sql
   02_academic_structure_and_resources.sql
   03_submissions_reviews_and_notifications.sql
   04_private_pdf_storage_and_uploads.sql
   05_search_admin_accounts_and_analytics.sql
   06_jbc_academic_catalog_seed.sql
   07_admin_resource_listing.sql
   08_moderator_review_queue.sql
   09_review_queue_scan_status_fix.sql
   10_rejected_upload_review_history.sql
   11_bookmarks_ratings_devices_and_preferences.sql
   12_public_profiles_and_rating_actions.sql
   13_upload_policy_acceptance.sql
   14_contributor_received_rating_calculation.sql
   15_manual_pdf_review_only.sql
   16_super_admin_resource_deletion.sql
   17_bca_old_new_curricula.sql
   ```

   Run one file at a time. Continue only after Supabase reports success.

3. In `10_bootstrap_super_admin.sql`, change only the `owner_email` value from
   `OWNER_EMAIL_HERE` to the verified Auth email, then run that file once in the
   SQL Editor. Never use editor-wide replacement or grant `super_admin` to an
   unverified account.
4. Run `20_verify_reinstall.sql` in the SQL Editor.
5. Run the repository policy tests where a local Supabase stack is available:

   ```sh
   npx supabase test db
   ```

6. Redeploy all Edge Functions and the frontend. Build the frontend from the
   repository root and publish the root `dist` directory:

   ```sh
   npm run build
   ```

## Migration equivalent

The numbered setup files mirror these migration files:

1. `202607170001_stage1_security.sql` — base profiles, resources, roles,
   auditing, newsletter boundary, and Auth profile trigger.
2. `202607170002_phase2_academic_resources.sql` — normalized campus/program/
   curriculum/term/subject/category model and resource versions.
3. `202607170003_phase2_workflows.sql` — submissions, reviews, comments,
   notifications, reports, feedback, and audited workflow RPCs.
4. `202607170004_phase3_private_storage.sql` — upload sessions, private bucket
   settings, validation state, and trusted Storage RPCs.
5. `202607170005_platform_completion.sql` — account controls, search,
   analytics, removal/deletion workflows, MFA-aware privileges, and indexes.
6. `202607170006_academic_catalog_seed.sql` — JBC/TU BCA, BICTE, BBS, and MBS
   academic catalog only; no resources.
7. `202607170007_admin_resource_listing.sql` — MFA-protected admin resource
   listing without exposing contributor identifiers through browser grants.
8. `202607170008_review_queue_listing.sql` — MFA-protected moderation queue
   projection without browser fan-out across private workflow tables.
9. `202607170009_review_queue_scan_status.sql` — compensating type correction
   for the queue projection's scan-status field.
10. `202607180010_rejected_review_history.sql` — rejected and automated-failure
    history for administrators while preserving the unsafe-file boundary.
11. `202607180011_account_engagement_pwa_foundation.sql` — bookmarks, ratings,
    device records, and preferences.
12. `202607180012_public_engagement_profiles.sql` — public contributor profiles
    and rating/bookmark RPCs.
13. `202607180012_upload_policy_acceptance.sql` — recorded Upload Policy
    acceptance for signed upload sessions.
14. `202607180013_contributor_received_ratings.sql` — contributor rating
    statistics based on ratings received on their resources.
15. `202607180014_manual_pdf_review_only.sql` — manual administrator review
    instead of content-based auto-rejection.
16. `202607180015_super_admin_resource_deletion.sql` — audited immediate
    permanent deletion for active Super Admins.
17. `202607180016_bca_old_new_curricula.sql` — separate old/currently-studied
    and new/2025 BCA syllabus catalogs.
