# Supabase setup

Do not paste ad-hoc schema or permissive RLS policies into production.

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
