# Backup and recovery

Status: required policy and procedures are defined. This repository does not prove that database backups, Storage exports, off-site copies, or restore drills currently exist.

## Required service objectives

Institutional owners must approve the final values. Recommended limited-beta starting targets:

- Database recovery point objective (RPO): 24 hours with daily backups; reduce to minutes only after PITR is funded and enabled.
- Storage RPO: 24 hours using an independent object export.
- Recovery time objective (RTO): 8 hours for a limited beta.
- Soft archive remains the normal reversible removal path. An active Super Admin may immediately and permanently delete a resource after AAL2 and exact-text confirmation; recovery then depends on available database and Storage backups.
- Backup retention: at least 30 days off-site for database logical exports and Storage copies, subject to approved privacy/retention policy.
- Restore drill: quarterly and before campus-wide launch.

Supabase's current documentation says managed database backups do not include Storage objects, only Storage metadata. Storage therefore needs a separate export: <https://supabase.com/docs/guides/platform/backups> and <https://supabase.com/docs/guides/storage/management/download-objects>.

## Backup setup checklist

1. In Supabase Dashboard → Database → Backups, record plan, backup type, available restore window, newest recovery point, and responsible owner. Paid-plan daily backup retention varies by plan; do not copy a plan assumption into the incident ticket without checking the live dashboard.
2. For projects without an adequate managed restore window, create a restricted scheduled logical dump:

   ```sh
   mkdir -p backups/database
   supabase db dump --linked --file backups/database/jbc-$(date -u +%Y%m%dT%H%M%SZ)-roles.sql --role-only
   supabase db dump --linked --file backups/database/jbc-$(date -u +%Y%m%dT%H%M%SZ)-schema.sql
   supabase db dump --linked --file backups/database/jbc-$(date -u +%Y%m%dT%H%M%SZ)-data.sql --data-only --use-copy
   ```

   Run from an approved secured backup runner, encrypt outputs, transfer them to institution-controlled off-site storage, and delete unencrypted working copies. Do not commit backup files.

3. Enable Supabase's S3-compatible Storage endpoint with a dedicated least-privilege backup credential, then configure an approved S3 client (for example rclone) to copy both private buckets to encrypted off-site object storage. Keep `resource-quarantine` retention short; retain `resource-published` according to policy.
4. Export/record non-database configuration separately: Auth URLs/settings, MFA/email requirements, Edge Function secrets names (not values), cron schedules, Cloudflare environment variable names, DNS, headers, and the approved deployment SHA.
5. Monitor backup job completion, object counts/bytes, checksum manifest generation, and off-site replication. Alert on one missed daily run.

## Pre-migration checkpoint

Before `supabase db push --linked`:

- Confirm the newest database restore point predates the change by less than the approved RPO.
- Confirm the newest Storage export and checksum manifest.
- Record current migration list, deployment SHA, object counts, and bucket bytes.
- Confirm the person authorized to restore is available.
- Use `supabase db push --linked --dry-run` and review the exact migration diff.

## Recovery procedure

1. Declare the incident and stop new uploads/reviews if continued writes would worsen recovery. Keep public reads available only if their integrity is known.
2. Identify the recovery time and preserve current logs/audit IDs.
3. Prefer a compensating forward migration for a narrowly scoped schema/policy error. Never edit an already-applied migration or disable RLS.
4. For full database recovery, use Supabase Dashboard → Database → Backups and select the approved daily/PITR point. Plan for project downtime during restoration.
5. Validate database recovery before restoring files:

   ```sh
   supabase migration list --linked
   supabase test db
   ```

6. Compare `storage.objects` metadata with the off-site manifest. Restore missing approved objects to their original private bucket/path using the S3-compatible client or `supabase storage cp`. Do not make buckets public.
7. Redeploy the exact approved Edge Functions/frontend SHA and restore Auth/cron configuration from the controlled record.
8. Run the recovery acceptance checklist below; reopen contribution first to staff, then a small beta cohort.

## Recovery acceptance checklist

- Public anonymous access returns only published, non-deleted records.
- Direct private bucket paths remain unavailable.
- A known published PDF preview/download works through the trusted signed function.
- Contributor login, email-verification gate, upload, cancellation, and submission tracking work.
- Moderator self-review is denied; a distinct reviewer can request changes/reject.
- Admin MFA/AAL2 gates and role/status changes work and create audit events.
- Reports/removal requests persist; cleanup cron completes.
- Object counts/checksums match the recovery manifest or every exception is documented.
- Cloudflare security headers and SPA fallback are intact.
- Monitoring is green and the deployment version matches the recovery record.

## Deletion recovery

Normal deletion is soft archive. Permanent deletion is available only after 90 archived days, strong confirmation, AAL2, super-admin authorization, and an audited service call. The transaction creates `resource_deletion_jobs`, deletes the resource, then attempts private Storage cleanup. Failed cleanup retains object paths only in the protected job and is retried by `cleanup-uploads`; it must not recreate the public resource.

## Restore drill record

For each drill record date, owners, source restore point, target isolated project, recovered row/object counts, elapsed time, failed checks, corrective tickets, and sign-off. A dashboard showing that a backup exists is not a restore test.
