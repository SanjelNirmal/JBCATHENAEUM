# Phases 4–22 implementation and deployment

Status: implemented and locally validated on 2026-07-17. Live infrastructure changes were deliberately not made from this workspace.

## Stage summaries

### Stage 3 — routing, data access, pagination, and search (Phases 4–6)

- Replaced in-memory view switching with lazy React Router routes, shareable URLs, SPA fallback, route loading/error boundaries, real not-found states, and URL-backed catalog filters.
- Split the former API surface into domain modules under `frontend/src/lib/supabase/`; added TanStack Query caching and bounded retry behavior.
- Added database-side full-text and trigram search, explicit public publication filtering, total counts, 12-item public pages, 20-item admin pages, page-size controls, indexed filters, and 400 ms search debouncing.
- Added server-applied admin resource filters for status, program, term, subject, contributor, creation date, sort, and page size.

Primary files: `frontend/src/app/*`, `frontend/src/pages/*`, `frontend/src/lib/supabase/*`, `frontend/public/_redirects`, and migrations `202607170005_platform_completion.sql` and `202607170006_academic_catalog_seed.sql`.

Security impact: invalid route values are bounded before query construction; the public search RPC returns only published, non-deleted resources tied to active academic records. RLS remains the authorization boundary.

### Stage 4 — contribution, tracking, and moderation (Phases 7–8)

- Completed authenticated, verified-email PDF contribution with normalized academic metadata, local draft recovery, upload progress, cancellation, retry, confirmation, and resubmission.
- Added My Submissions feedback/actions and a private notifications page.
- Split administration into overview, reviews, resources, users, academic structure, reports/removals, audit logs, and read-only settings.
- Added review claim/preview/decision, contributor links, responsive tables/cards, bulk decisions, audited reviewer assignment, archive/restore, safe metadata/profile editing, status/role controls, and retryable retention-gated permanent deletion.

Primary files: `frontend/src/components/ContributeView.tsx`, `frontend/src/pages/MySubmissionsPage.tsx`, `frontend/src/pages/NotificationsPage.tsx`, `frontend/src/features/admin/*`, and the upload/review/deletion Edge Functions.

Security impact: verified email is enforced in both UI and trusted upload issuance; reviewers cannot approve their own submission; privileged actions inherit AAL2 checks; permanent deletion is super-admin/service-only and creates an audit plus recoverable Storage cleanup job.

### Stage 5 — responsive layouts and navigation (Phases 6, 8, and 10)

- Moved full desktop navigation to a 960 px breakpoint, added mobile search, active route states, keyboard-operable drawers, responsive filters, table overflow/sticky actions, and mobile action cards.
- Kept content usable from 320 px upward with bounded widths, reduced nested form padding, and global horizontal-overflow protection.

Primary files: `frontend/src/components/SiteHeader.tsx`, `frontend/src/features/admin/AdminLayout.tsx`, catalog/contribution/admin pages, and `frontend/src/index.css`.

User impact: back/forward navigation, direct links, filters, and all important moderation/resource actions remain available on mobile.

### Stage 6 — accessibility, states, and authentication (Phases 11–14)

- Added a skip link, semantic navigation/actions, labels, live regions, visible focus, reduced motion, accessible status text, minimum control sizes, and reusable focus-managed modals/drawers with Escape/focus restoration.
- Added loading, empty, safe error, retry, disabled mutation, partial-result, success, and failure states on data-heavy workflows.
- Added signup, email confirmation guidance, login/logout, password recovery/update, session restoration, multi-tab auth events, account suspension/disablement handling, TOTP enrollment/challenge, and AAL2 admin presentation gates.
- Managed PDFs use short-lived function URLs; legacy URLs require HTTPS plus an exact Google host allowlist, sandboxing, no-referrer behavior, and a visible external-source warning.

Primary files: `frontend/src/components/AccessibleModal.tsx`, `ConfirmDialog.tsx`, `MfaPanel.tsx`, `AsyncState.tsx`, `frontend/src/lib/useDialogFocus.ts`, auth pages/modules, and `ResourceDetailPage.tsx`.

### Stage 7 — analytics, trust, reporting, and SEO (Phases 9, 15–16)

- Replaced fake counts with aggregate RPC results and operational admin metrics, including publication/review/user/download/storage/report/upload/metadata/cleanup signals.
- Persisted authenticated resource reports and public content-removal requests through validation, an IP-hash cooldown, optional Turnstile verification, admin resolution, and audit events.
- Added canonical/Open Graph/robots metadata, valid static sitemap entries, admin/private/login `noindex`, and explicit 404 routing. Signed URLs are not indexed.
- Added draft governance pages that clearly require institutional approval; no legal approval or official contact is invented.

Primary files: analytics/report modules, `HomePage.tsx`, `RemovalRequestPage.tsx`, `PolicyPage.tsx`, `Seo.tsx`, `frontend/public/robots.txt`, and `frontend/public/sitemap.xml`.

### Stage 8 — performance, dependencies, testing, and operations (Phases 17–22)

- Lazy-loaded all page groups and nested admin pages; isolated React/router/Supabase/query/icons/vendor chunks; retained immutable hashed-asset caching; removed unused GenAI, frontend Express/dotenv, `react-snap`, and `vite-plugin-ssr` packages; moved build tooling to development dependencies.
- Added unit/component tests, pgTAP schema/security tests, Playwright public/live suites, and axe checks.
- Added sanitized client error events, deployment version display, cleanup metrics, operational alert guidance, backup/recovery procedures, and campus governance ownership/approval checklists.

Primary files: `frontend/vite.config.ts`, package files, test directories, `supabase/tests/platform_completion.sql`, `supabase/tests/academic_catalog_seed.sql`, `docs/OPERATIONS_MONITORING.md`, `docs/BACKUP_RECOVERY.md`, and `docs/CAMPUS_GOVERNANCE.md`.

## Owner-run deployment procedure

Do not apply this to production until a restorable backup and an isolated preview validation exist.

1. Install and authenticate the Supabase CLI, then link the intended project explicitly:

   ```sh
   supabase login
   supabase link --project-ref <PROJECT_REF>
   supabase migration list --linked
   ```

2. In Supabase Dashboard → Database → Backups, record the newest usable restore point. Complete the Storage export in `docs/BACKUP_RECOVERY.md`. Do not proceed if either recovery path is unverified.

3. Review and dry-run every pending migration:

   ```sh
   supabase db lint --linked
   supabase db push --linked --dry-run
   git diff -- supabase/migrations
   ```

4. Apply and test the database:

   ```sh
   supabase db push --linked
   supabase test db
   supabase migration list --linked
   ```

5. Generate independent secrets and set the Edge Function environment:

   ```sh
   openssl rand -hex 32
   openssl rand -hex 32
   supabase secrets set \
     ALLOWED_ORIGINS="https://jbcathenaeum.pages.dev,https://<PREVIEW_HOST>" \
     MAX_UPLOAD_BYTES="26214400" \
     UPLOAD_CLEANUP_CRON_SECRET="<FIRST_RANDOM_VALUE>" \
     RATE_LIMIT_HASH_SALT="<SECOND_RANDOM_VALUE>"
   ```

   Do not set `TURNSTILE_SECRET_KEY` until a Turnstile widget supplies `turnstileToken` from the removal form. Setting only the secret would correctly reject every form submission.

6. Deploy the reviewed functions:

   ```sh
   for fn in create-upload-session finalize-upload cancel-upload publish-resource review-resource-file decide-resource-review resource-download cleanup-uploads submit-removal-request permanently-delete-resource; do
     supabase functions deploy "$fn"
   done
   ```

7. Configure the 15-minute `cleanup-uploads` schedule exactly as described in `docs/PHASE_3_STORAGE.md`. Confirm one successful invocation and inspect both `resource_upload_sessions.failure_code` and `resource_deletion_jobs`.

8. In Supabase Dashboard → Authentication:

   - Set Site URL to `https://jbcathenaeum.pages.dev`.
   - Add the production and preview `/login` and `/reset-password` redirect URLs.
   - Require email confirmation.
   - Set the minimum password length to at least 10.
   - Enable TOTP MFA.
   - Enroll every moderator/admin/super-admin before granting production access.

9. In Cloudflare Pages configure:

   - Build command: `npm run build`
   - Build output: `dist`
   - `VITE_SUPABASE_URL=<PUBLIC_PROJECT_URL>`
   - `VITE_SUPABASE_ANON_KEY=<PUBLIC_PUBLISHABLE_OR_ANON_KEY>`
   - `VITE_APP_VERSION=<COMMIT_SHA>`
   - `VITE_DEPLOYED_AT=<ISO_8601_TIMESTAMP>`

   Do not add the service-role key or custom Edge Function secrets to Cloudflare. Deploy to a preview first and verify `_headers`, `_redirects`, `robots.txt`, and `sitemap.xml` are present.

10. Run the preview acceptance suite with distinct student, moderator, admin, and super-admin accounts:

    ```sh
    VITE_SUPABASE_URL=<TEST_PROJECT_URL> \
    VITE_SUPABASE_ANON_KEY=<TEST_PUBLIC_KEY> \
    E2E_LIVE_PROJECT=true \
    E2E_CONTRIBUTOR_EMAIL=<TEST_EMAIL> \
    E2E_CONTRIBUTOR_PASSWORD=<TEST_PASSWORD> \
    npm run test:e2e --workspace frontend
    ```

11. Enable monitoring according to `docs/OPERATIONS_MONITORING.md`, complete a restore drill according to `docs/BACKUP_RECOVERY.md`, and obtain the approvals in `docs/CAMPUS_GOVERNANCE.md` before campus-wide rollout.

## Validation and remaining risks

Final local validation completed on 2026-07-17:

- TypeScript and backend syntax checks passed.
- 68 frontend and 3 backend tests passed.
- The production build passed; the routed entry chunk is 24.39 kB (7.92 kB gzip), and no emitted file exceeded 250 kB.
- The npm audit reported zero known vulnerabilities.
- Prettier and sitemap XML checks passed.
- Playwright passed eight public desktop/mobile tests, including axe, safe network-failure recovery, and an eight-width overflow matrix. Eight tests were skipped by design: two project-inapplicable responsive cases and six live Supabase cases awaiting isolated-project credentials.

The 42 platform/catalog pgTAP assertions and live lifecycle/E2E tests require a linked local or isolated Supabase project. They were not represented as executed because this workspace has neither the Supabase CLI/PostgreSQL runtime nor owner-supplied test-project credentials.

The repository cannot establish that live RLS, Auth redirects, TOTP enrollment, cron, Cloudflare headers/analytics, uptime/error alerting, backups, Storage exports, or institutional policy approval exist. Limited beta remains blocked until the owner-run steps and live acceptance matrix pass.
