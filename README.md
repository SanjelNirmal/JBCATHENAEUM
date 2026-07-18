# JBC Athenaeum

JBC Athenaeum is a React 19, TypeScript, Vite, Tailwind CSS, Supabase, and Cloudflare Pages academic-resource platform for Jana Bhawana Campus.

The application now includes:

- Shareable React Router routes and URL-backed resource filters.
- PostgreSQL full-text/trigram search with server-side pagination.
- Normalized campus, faculty, program, curriculum, term, subject, and category records, including separate old/currently-studied and new/2025 BCA syllabus choices.
- Private PDF quarantine and published Storage buckets with signed access.
- Authenticated contribution, draft recovery, review feedback, resubmission, and notifications.
- MFA/AAL2-protected moderation, role, suspension, bulk action, and deletion workflows.
- Real database aggregates, reports, removal requests, audit logs, and deployment diagnostics.
- Responsive table/card layouts, focus-managed dialogs/drawers, reduced-motion support, and automated accessibility checks.
- Capacitor 8 Android/iOS projects with shared React/Supabase code, strict deep links, and release runbooks.

## Local development

```sh
npm install
cp frontend/.env.example frontend/.env.local
npm run dev
```

Set only the public Supabase project URL and publishable/anonymous key in `frontend/.env.local`. Never put a service-role key, database password, Cloudflare token, SMTP password, or other secret in a `VITE_` variable.

## Optional project support

JBC Athenaeum resources remain free. The footer's **Buy me a coffee** action is
an optional bank-transfer prompt and is never used as an access check or
document paywall.

Bank display details are centralized in
`frontend/src/config/payment.ts`. To enable the QR display, add the verified NMB
QR image at:

```text
frontend/public/payment/nmb-payment-qr.png
```

If the image is absent, the modal safely falls back to the bank details. The
application does not collect payment receipts, transaction references, banking
credentials, or screenshots. The native app does not show this optional support
prompt; paid-content and external-payment controls remain disabled pending
Apple/Google policy review.

## Android and iOS

Capacitor belongs to the `frontend` workspace:

```sh
cd frontend
npm run cap:sync
npx cap open android
npx cap open ios
```

The native app identifier is `np.com.nirmalsanjel.jbcathenaeum`.

For local iOS builds with a Personal Team, keep automatic signing enabled and
do not add the `Associated Domains` capability. That capability requires a paid
Apple Developer account and a matching provisioning profile.

See [the mobile release runbook](docs/MOBILE_RELEASE.md) for prerequisites,
signing, deep-link association, Supabase redirect URLs, privacy declarations,
payment policy, honest test status, and release blockers.

## Quality gates

```sh
npm run lint
npm test
npm run build
npm audit
npm run test:e2e:public --workspace frontend
```

Playwright browser installation is a one-time developer/CI step:

```sh
npx playwright install chromium
```

## Production setup

Apply migrations in filename order and deploy Edge Functions only after reviewing the owner runbooks:

- [New Supabase account — numbered SQL Editor setup](supabase/sql_editor_setup/README.md)
- [Clean Supabase reinstall](supabase/reinstall/README.md)
- [Supabase setup](frontend/SUPABASE_SETUP.md)
- [Phases 4–22 implementation and deployment](docs/PHASES_4_22_IMPLEMENTATION.md)
- [Operations and monitoring](docs/OPERATIONS_MONITORING.md)
- [Backup and recovery](docs/BACKUP_RECOVERY.md)
- [Campus governance](docs/CAMPUS_GOVERNANCE.md)

The repository is locally hardened, but it is not a claim that the live Supabase project, Cloudflare project, monitoring providers, backups, or institutional policies are configured. Those owner-controlled gates must be verified before a limited campus beta.
