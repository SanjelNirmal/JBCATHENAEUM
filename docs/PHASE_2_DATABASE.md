# Phase 2 production database model

Phase 2 adds an extensible academic catalog, versioned resources, a submission/review workflow, notifications, resource reports, feedback, and expanded append-only auditing. It does not create Storage buckets or implement uploads; those belong to Phase 3.

## Migration order

1. `202607170001_stage1_security.sql`
2. `202607170002_phase2_academic_resources.sql`
3. `202607170003_phase2_workflows.sql`

The Phase 2 migrations assume Stage 1 has succeeded. They are additive and do not delete existing resources, profiles, newsletter subscriptions, or role data.

## Academic model

The authoritative hierarchy is:

```text
campus
└── faculty
    └── program
        └── curriculum version
            └── term
                └── subject
```

Resource categories are campus-scoped. Every resource must reference a campus, program, curriculum version, term, subject, and category through UUID foreign keys.

Existing labels are backfilled under `Jana Bhawana Campus`. Since the legacy UI called BCA, BICTE, BSW, and BBS “faculties,” each distinct legacy faculty label is initially represented as both a faculty and a program. A project owner should review and correct that hierarchy through normalized records before adding another campus.

## Compatibility bridge

These legacy `resources` columns are retained temporarily:

- `faculty`
- `semester`
- `subject`
- `file_url`
- `file_size`
- `author_name`
- `author_id`

They are no longer authoritative. Existing rows receive normalized foreign keys, a unique slug, `published` status, and a `legacy_unverified` version. The frontend's temporary admin form now calls `import_legacy_resource`, which canonicalizes academic labels, records normalized references, creates a version, and writes an audit event.

The bridge accepts administrator-only HTTPS links so current administration remains functional. Remove it after the Phase 3 private Storage rollout.

## Resource lifecycle

The supported states are:

```text
draft → submitted → under_review → approved → published
                              ├── changes_requested → submitted
                              └── rejected → submitted
published → archived → restored
```

Trusted RPCs enforce the lifecycle:

- `submit_resource`
- `claim_resource_review`
- `decide_resource_review`
- `publish_resource`
- `archive_resource`
- `restore_resource`

Direct browser insert/update/delete privileges are removed from resources, versions, submissions, reviews, and comments. Submitters cannot review their own submissions; this is enforced both in workflow functions and by a database trigger.

## Privacy and authorization

- Anonymous users receive column-limited access to published, non-deleted resources whose academic entities are active.
- Storage paths, legacy scan results, checksums, owner IDs, and reviewer IDs are not included in public column grants.
- Resource owners can read their own resource rows through RLS, but only safe granted columns.
- Moderators and administrators can read review queues.
- Notification rows are private to their recipient; clients can update only `read_at`.
- Reports are visible only to the reporter and administrators.
- Feedback is inserted only through a validating RPC and is readable only by administrators.
- Audit events remain append-only to browser clients.

## Newsletter and anonymous-abuse boundary

Newsletter signup continues through the validated, duplicate-safe `subscribe_to_newsletter` RPC. Feedback has a per-email 15-minute database cooldown. These controls do not replace IP/device throttling or bot challenges. Before advertising either endpoint broadly, place it behind a Supabase Edge Function or Cloudflare Worker with a server-held rate-limit salt and Turnstile verification. Do not send a raw client-provided IP address into PostgreSQL.

## Owner-run deployment

Codex did not apply these migrations to the live project.

1. Complete the backup and project-link procedure in `docs/STAGE_1_SECURITY.md`.
2. Inspect the migration plan:

   ```sh
   supabase migration list --linked
   supabase db push --linked --dry-run
   ```

3. Apply all pending migrations:

   ```sh
   supabase db push --linked
   ```

4. Bootstrap the verified super administrator using the transaction in `docs/STAGE_1_SECURITY.md`.
5. Run the database tests:

   ```sh
   supabase test db
   ```

6. Verify the backfill before deployment:

   ```sql
   select count(*) as unresolved_resources
   from public.resources
   where campus_id is null
      or program_id is null
      or curriculum_version_id is null
      or term_id is null
      or subject_id is null
      or category_id is null;

   select status, count(*)
   from public.resources
   group by status
   order by status;

   select scan_status, count(*)
   from public.resource_versions
   group by scan_status
   order by scan_status;
   ```

   `unresolved_resources` must be zero. Existing resources should be `published` with one `legacy_unverified` version each.

7. In a Cloudflare preview, verify public resources still load, archived resources disappear, a legacy admin import produces normalized references, and unauthorized REST writes return `42501`.
8. Promote only after database tests and two-account role/review tests pass.

## Recovery

If the migration transaction fails, PostgreSQL rolls it back. If post-deployment behavior is incorrect, stop promotion and create a compensating migration; do not edit applied migration files. Restore the verified backup if data integrity is affected. Never recover by making draft resources public, restoring direct table mutations, or disabling RLS.
