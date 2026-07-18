# Supabase setup

Do not paste ad-hoc schema or permissive RLS policies into production.

## Brand-new Supabase account

For a new, empty Supabase project, use the simplified SQL Editor package:

[`supabase/sql_editor_setup/README.md`](../supabase/sql_editor_setup/README.md)

It provides clearly named files `01` through `15`, followed by the optional
first-super-admin file `90` and read-only verification file `99`. Run them one
at a time in numeric order.

## Existing project upgrades

The reviewed, data-preserving migrations are applied in filename order:

`supabase/migrations/202607170001_stage1_security.sql`

`supabase/migrations/202607170002_phase2_academic_resources.sql`

`supabase/migrations/202607170003_phase2_workflows.sql`

`supabase/migrations/202607170004_phase3_private_storage.sql`

`supabase/migrations/202607170005_platform_completion.sql`

`supabase/migrations/202607170006_academic_catalog_seed.sql`

`supabase/migrations/202607170007_admin_resource_listing.sql`

`supabase/migrations/202607170008_review_queue_listing.sql`

`supabase/migrations/202607170009_review_queue_scan_status.sql`

`supabase/migrations/202607180010_rejected_review_history.sql`

`supabase/migrations/202607180011_account_engagement_pwa_foundation.sql`

`supabase/migrations/202607180012_public_engagement_profiles.sql`

`supabase/migrations/202607180012_upload_policy_acceptance.sql`

`supabase/migrations/202607180013_contributor_received_ratings.sql`

`supabase/migrations/202607180014_manual_pdf_review_only.sql`

## Auth redirects for web and native apps

Keep the production web callback and add the Capacitor custom-scheme callback
to the live Supabase Auth redirect allowlist:

```text
https://jbc.nirmalsanjel.com.np/auth/callback
jbcathenaeum://auth/callback
```

Local development may additionally allow
`http://localhost:3000/auth/callback`. Do not use wildcards for production
callbacks and do not add service-role credentials to the mobile app.

The database security and model tests are:

`supabase/tests/stage1_security.sql`

`supabase/tests/phase2_model.sql`

`supabase/tests/phase3_storage.sql`

`supabase/tests/platform_completion.sql`

`supabase/tests/academic_catalog_seed.sql`

`supabase/tests/account_engagement.sql`

After applying migrations to the linked preview project, compare the checked-in
schema snapshot with freshly generated types before promoting the frontend:

```sh
supabase gen types typescript --linked > /tmp/jbc-database.generated.ts
diff -u frontend/src/lib/supabase/database.types.ts /tmp/jbc-database.generated.ts
```

Reconcile expected generator formatting/type-alias differences, then run
`npm run lint` so every query and RPC remains checked against the deployed
schema.

Follow `docs/STAGE_1_SECURITY.md`, `docs/PHASE_2_DATABASE.md`, `docs/PHASE_3_STORAGE.md`, and `docs/PHASES_4_22_IMPLEMENTATION.md` for backup verification, dry-run, owner bootstrap, policy testing, Storage deployment, search/account/analytics deployment, Cloudflare configuration, and recovery.
