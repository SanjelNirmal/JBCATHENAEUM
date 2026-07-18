# New Supabase project — SQL Editor installation

Use this folder when installing JBC Athenaeum into a **brand-new, empty
Supabase project**. The files are deliberately numbered in the exact order in
which they must be run.

Do not use these files to upgrade an existing production project. Existing
projects must use the forward-only files in `supabase/migrations` so stored
data is preserved.

## Before running SQL

1. Create the new Supabase project and wait until it reports that the project
   is ready.
2. Open **Authentication → Providers → Email**. Enable email authentication
   and decide whether your users must confirm their email.
3. Open **SQL Editor → New query**.

## Run the database files

Run **one file at a time**. For each file:

1. Open the file from this folder.
2. Copy the entire SQL file into a new Supabase SQL Editor query.
3. Click **Run**.
4. Continue only after Supabase reports success.

Run these files in this exact order:

| Order | SQL file | What it installs |
|---:|---|---|
| 01 | `01_core_security_profiles_and_roles.sql` | Profiles, resources, trusted roles, audit log, RLS foundation and Auth profile trigger |
| 02 | `02_academic_structure_and_resources.sql` | Campus, faculty, program, curriculum, term, subject, category and resource-version structure |
| 03 | `03_submissions_reviews_and_notifications.sql` | Submission, moderation, notification, report and feedback workflows |
| 04 | `04_private_pdf_storage_and_uploads.sql` | Private PDF buckets, upload sessions and trusted storage functions |
| 05 | `05_search_admin_accounts_and_analytics.sql` | Search, account controls, analytics, removal requests and administration functions |
| 06 | `06_jbc_academic_catalog_seed.sql` | Jana Bhawana Campus BCA, BICTE, BBS and MBS catalog |
| 07 | `07_admin_resource_listing.sql` | Protected administrator resource listing |
| 08 | `08_moderator_review_queue.sql` | Protected moderator review queue |
| 09 | `09_review_queue_scan_status_fix.sql` | Review queue scan-status compatibility correction |
| 10 | `10_rejected_upload_review_history.sql` | Rejected upload and moderation history |
| 11 | `11_bookmarks_ratings_devices_and_preferences.sql` | Bookmarks, ratings, devices and notification preferences |
| 12 | `12_public_profiles_and_rating_actions.sql` | Public contributor profiles, public reviews and safe rating/bookmark actions |
| 13 | `13_upload_policy_acceptance.sql` | Recorded Upload Policy acceptance |
| 14 | `14_contributor_received_rating_calculation.sql` | Correct contributor rating statistics based on ratings received |

Each numbered file has its own transaction. If a file fails, stop at that
number, copy the complete Supabase error, and fix the cause before continuing.
Do not skip a failed file and do not disable RLS to make an error disappear.

## Create the first administrator

1. Create the owner account through the application sign-up page or through
   **Authentication → Users → Add user**.
2. Confirm that user's email address.
3. Open `90_create_first_super_admin.sql`.
4. Replace only `OWNER_EMAIL_HERE` with the confirmed owner's email.
5. Run the complete file once.

This step does not create an Auth password and must never contain a password,
anon key or service-role key.

## Verify the installation

Run `99_verify_new_project.sql`. A successful result contains this notice:

```text
JBC Athenaeum new-project verification passed
```

The verification is read-only and rolls back its own transaction.

## Dashboard settings after SQL

Add these exact Auth redirect URLs:

```text
https://jbc.nirmalsanjel.com.np/auth/callback
jbcathenaeum://auth/callback
```

For local development, you may also add:

```text
http://localhost:3000/auth/callback
```

The SQL creates the `resource-quarantine` and `resource-published` private
Storage buckets. Do not make either bucket public.

## Deploy the Edge Functions

Database SQL does not deploy Edge Functions. Link the Supabase CLI to the new
project, then deploy the application functions:

```sh
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-upload-session
npx supabase functions deploy finalize-upload
npx supabase functions deploy cancel-upload
npx supabase functions deploy cleanup-uploads
npx supabase functions deploy review-resource-file
npx supabase functions deploy decide-resource-review
npx supabase functions deploy publish-resource
npx supabase functions deploy resource-download
npx supabase functions deploy permanently-delete-resource
npx supabase functions deploy submit-removal-request
```

Finally, set the frontend deployment variables to the new project's URL and
anon key:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_NEW_PROJECT_ANON_KEY
```

Never put the Supabase service-role key in the frontend, GitHub repository,
Android app or iOS app.
