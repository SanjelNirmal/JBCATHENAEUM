# JBC Athenaeum clean reinstall

This procedure intentionally deletes every application object and row in the
`public` schema. It preserves Supabase-managed Auth users and the `auth`,
`storage`, `realtime`, `vault`, `extensions`, and migration-history schemas.

The seven repository migrations are the complete application SQL. Together
they install 24 public tables, all columns and constraints, seven enums,
indexes, triggers, RLS policies, grants, RPC functions, private Storage bucket
configuration, and the real Jana Bhawana Campus academic catalog. They do not
insert resources, submissions, reports, analytics events, or other mock
content.

## Before starting

1. Confirm the CLI is linked to project `pwvwiledybefqlkrlwga`.
2. Because data loss is intended, delete the `resource-quarantine` and
   `resource-published` buckets through the Supabase Storage dashboard first if
   they contain files. Deleting Storage rows directly with SQL can orphan the
   underlying objects.
3. Keep `auth.users`. Deleting Supabase Auth tables would break login and is not
   part of this reinstall.

## Reinstall

1. Run `00_reset_public_schema.sql` once in the Supabase SQL Editor.
2. Make the remote migration ledger replay the complete local chain. First
   inspect it:

   ```sh
   npx supabase migration list --linked
   ```

3. Mark every version currently shown in the REMOTE column as reverted. For
   this repository the possible versions are:

   ```sh
   npx supabase migration repair \
     202607170001 \
     202607170002 \
     202607170003 \
     202607170004 \
     202607170005 \
     202607170006 \
     202607170007 \
     --status reverted \
     --linked
   ```

   If the CLI rejects a version that was never recorded remotely, rerun the
   command with only the versions actually present in the REMOTE column.

4. Preview the full replay. It must list migrations `001` through `007` in
   order:

   ```sh
   npx supabase db push --linked --include-all --dry-run
   ```

5. Apply the complete SQL chain:

   ```sh
   npx supabase db push --linked --include-all
   ```

6. In `10_bootstrap_super_admin.sql`, change only the `owner_email` value from
   `OWNER_EMAIL_HERE` to the verified Auth email, then run that file once in the
   SQL Editor. Never use editor-wide replacement or grant `super_admin` to an
   unverified account.
7. Run `20_verify_reinstall.sql` in the SQL Editor.
8. Run the repository policy tests where a local Supabase stack is available:

   ```sh
   npx supabase test db
   ```

9. Redeploy all Edge Functions and the frontend. Build the frontend from the
   repository root and publish the root `dist` directory:

   ```sh
   npm run build
   ```

## SQL application order

The CLI executes these complete SQL files in filename order:

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
