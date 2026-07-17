# Phase 3 private Storage and secure uploads

Phase 3 replaces email contributions with authenticated PDF uploads. Files enter a private quarantine bucket, pass server-side validation, enter review, and move to a private published bucket only after approval. Public access uses short-lived signed redirects.

## Security model

- `resource-quarantine` and `resource-published` are private buckets.
- Browser clients have no `storage.objects` policies and cannot choose object paths.
- A trusted Edge Function creates a generated path and a two-hour signed upload URL.
- The browser performs basic PDF/size checks for usability only.
- `finalize-upload` downloads the quarantined bytes and verifies size, `%PDF-` signature, `%%EOF`, parseability, page count, encryption state, active PDF features, and SHA-256 uniqueness.
- Rejected or changes-requested resources can be resubmitted only by their owner. Each resubmission creates a generated quarantine path and a new immutable version while preserving prior review history. Clean versions rejected by a human reviewer remain private so authorized staff can audit the decision.
- Failed, cancelled, expired, malformed, encrypted, duplicate, and active-content files are removed from quarantine and recorded with a terminal status.
- Automated rejection records and validation reasons remain visible to administrators, but the rejected raw file is not previewable or recoverable from the application.
- Review previews use five-minute signed URLs.
- Publication copies the clean approved version into the private published bucket before the database is marked published.
- Public document access redirects to a short-lived signed URL; Storage paths and permanent bucket URLs are not exposed by database grants.

The validator rejects common active PDF constructs, but it is not a commercial malware engine or content-disarm-and-reconstruction service. Add an external malware scanning provider before accepting files from an untrusted internet-wide audience.

## Edge Functions

| Function                      | Authentication                                    | Purpose                                                                             |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `create-upload-session`       | User JWT validated inside function                | Create draft/session and issue generated signed upload URL                          |
| `finalize-upload`             | User JWT validated inside function                | Download and validate actual PDF bytes, checksum, and submit                        |
| `cancel-upload`               | User JWT validated inside function                | Abort and remove owned quarantine upload                                            |
| `review-resource-file`        | Moderator/admin JWT                               | Five-minute private review preview                                                  |
| `decide-resource-review`      | Moderator/admin JWT                               | Apply the database review decision and retain a clean private copy for review history |
| `publish-resource`            | Admin JWT                                         | Promote clean approved PDF and publish atomically where possible                    |
| `resource-download`           | Public, explicit published-row check              | Redirect to short-lived private signed URL                                          |
| `cleanup-uploads`             | Cron secret                                       | Remove expired/orphaned quarantine objects                                          |
| `submit-removal-request`      | Public, validation and rate limit inside function | Persist a structured content-removal request                                        |
| `permanently-delete-resource` | Super-admin JWT with AAL2                         | Apply retention-gated deletion and create retryable Storage cleanup work            |

Supabase documents that private buckets require authenticated access or signed URLs, and that bucket-level MIME/size restrictions are supported: https://supabase.com/docs/guides/storage/buckets/fundamentals

## Required secrets

Supabase automatically provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Configure only these custom secrets:

```sh
supabase secrets set \
  ALLOWED_ORIGINS="https://jbc.nirmalsanjel.com.np,https://jbcathenaeum.pages.dev,https://<CLOUDFLARE_PREVIEW_HOST>" \
  MAX_UPLOAD_BYTES="26214400" \
  UPLOAD_CLEANUP_CRON_SECRET="<GENERATE_A_LONG_RANDOM_SECRET>" \
  RATE_LIMIT_HASH_SALT="<GENERATE_A_DIFFERENT_LONG_RANDOM_SECRET>"
```

Never place the service-role key or cleanup secret in Cloudflare/Vite variables.
For testing from another device on the local network, append the exact origin
(for example `http://192.168.101.5:3000`) to `ALLOWED_ORIGINS`; do not use `*`
or allow an entire private-address range. Using `http://localhost:3000` already
works without adding a secret value.

## Owner-run deployment

Codex did not modify the live Supabase project.

1. Verify the backup and project link described in the earlier runbooks.
2. Confirm there are no existing broad Storage policies:

   ```sql
   select policyname, roles, cmd, qual, with_check
   from pg_policies
   where schemaname = 'storage' and tablename = 'objects';
   ```

   Phase 3 intentionally aborts if any policy exists, because PostgreSQL RLS policies combine permissively. If the query returns rows, have the policies reviewed and scoped before adapting the migration—do not delete unrelated policies blindly.

3. Inspect and apply the migration:

   ```sh
   supabase db push --linked --dry-run
   supabase db push --linked
   supabase test db
   ```

4. Set the custom secrets, then deploy:

   ```sh
   supabase functions deploy create-upload-session
   supabase functions deploy finalize-upload
   supabase functions deploy cancel-upload
   supabase functions deploy review-resource-file
   supabase functions deploy decide-resource-review
   supabase functions deploy publish-resource
   supabase functions deploy resource-download
   supabase functions deploy cleanup-uploads
   supabase functions deploy submit-removal-request
   supabase functions deploy permanently-delete-resource
   ```

   A browser CORS error with an Edge Function gateway `404 NOT_FOUND` means the
   function was not deployed; changing frontend headers cannot fix it. Deploy
   every function in the upload/review sequence, then verify the production
   preflight returns `204` and the exact custom origin:

   ```sh
   curl -i -X OPTIONS \
     "https://<PROJECT_REF>.supabase.co/functions/v1/create-upload-session" \
     -H "Origin: https://jbc.nirmalsanjel.com.np" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: authorization,apikey,content-type,x-client-info"
   ```

   The response must contain
   `Access-Control-Allow-Origin: https://jbc.nirmalsanjel.com.np`. A `401`
   indicates gateway JWT verification was not disabled from `supabase/config.toml`;
   a `404` indicates that the named function is still absent.

5. Enable `pg_cron`, `pg_net`, and Vault. Store the project URL, publishable key, and the same cleanup secret in Vault, then schedule cleanup every 15 minutes:

   ```sql
   select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'phase3_project_url');
   select vault.create_secret('<PUBLISHABLE_KEY>', 'phase3_publishable_key');
   select vault.create_secret('<CLEANUP_CRON_SECRET>', 'phase3_cleanup_secret');

   select cron.schedule(
     'jbc-cleanup-expired-uploads',
     '*/15 * * * *',
     $$
     select net.http_post(
       url := (select decrypted_secret from vault.decrypted_secrets where name = 'phase3_project_url') || '/functions/v1/cleanup-uploads',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'phase3_publishable_key'),
         'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'phase3_cleanup_secret')
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

   Supabase's official scheduling pattern uses `pg_cron`, `pg_net`, and secrets stored in Vault: https://supabase.com/docs/guides/functions/schedule-functions

6. Deploy to a Cloudflare preview and test with distinct student, moderator, and admin accounts.

## Required acceptance tests

- A signed-out visitor cannot create an upload session.
- A user cannot access or cancel another user's session.
- `.html`, `.svg`, ZIP, executable, empty, oversized, mismatched MIME, malformed, encrypted, duplicate, embedded-file, and JavaScript-action inputs are rejected.
- A network interruption can retry against the same signed upload URL while it remains valid.
- Cancellation removes the quarantine object; the cron removes abandoned objects.
- A submitter cannot claim or approve their own submission.
- A moderator can preview and decide a clean submission but cannot publish it.
- A rejected or changes-requested submission shows contributor feedback and can be resubmitted only by its owner as a new version.
- An administrator can filter rejected review records and inspect the automated validation reason; unsafe or malformed bytes remain unavailable.
- A clean submission rejected by a human reviewer remains privately previewable to authorized staff as read-only history.
- An administrator can promote an approved file; the quarantine copy is removed.
- Direct public bucket URLs and Storage paths are unavailable.
- Published previews and downloads work through short-lived signed redirects.
- Legacy Google Drive resources remain readable during the migration window.

## Recovery and partial failures

If publication copies an object but the database transition fails, `publish-resource` restores the version metadata to quarantine and removes the destination copy. If quarantine deletion fails after publication, the upload session is marked `quarantine_cleanup_pending`. Human-rejected clean files remain private for audit instead of entering cleanup. Permanent deletion writes a `resource_deletion_jobs` record before deleting the resource; failed private-object cleanup remains recoverable and is retried by the same scheduled function. Review Edge Function logs, `resource_upload_sessions.failure_code`, and `resource_deletion_jobs` before manual object deletion.
