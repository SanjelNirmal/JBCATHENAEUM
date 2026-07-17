# Supabase setup

Do not paste ad-hoc schema or permissive RLS policies into production.

The reviewed, data-preserving migrations are applied in filename order:

`supabase/migrations/202607170001_stage1_security.sql`

`supabase/migrations/202607170002_phase2_academic_resources.sql`

`supabase/migrations/202607170003_phase2_workflows.sql`

The database security and model tests are:

`supabase/tests/stage1_security.sql`

`supabase/tests/phase2_model.sql`

Follow `docs/STAGE_1_SECURITY.md` and `docs/PHASE_2_DATABASE.md` for backup verification, dry-run, owner bootstrap, policy testing, backfill verification, Cloudflare configuration, and recovery.
