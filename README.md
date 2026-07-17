# JBC Athenaeum

JBC Athenaeum is a React 19, TypeScript, Vite, Tailwind CSS, Supabase, and Cloudflare Pages academic-resource platform for Jana Bhawana Campus.

The application now includes:

- Shareable React Router routes and URL-backed resource filters.
- PostgreSQL full-text/trigram search with server-side pagination.
- Normalized campus, faculty, program, curriculum, term, subject, and category records.
- Private PDF quarantine and published Storage buckets with signed access.
- Authenticated contribution, draft recovery, review feedback, resubmission, and notifications.
- MFA/AAL2-protected moderation, role, suspension, bulk action, and deletion workflows.
- Real database aggregates, reports, removal requests, audit logs, and deployment diagnostics.
- Responsive table/card layouts, focus-managed dialogs/drawers, reduced-motion support, and automated accessibility checks.

## Local development

```sh
npm install
cp frontend/.env.example frontend/.env.local
npm run dev
```

Set only the public Supabase project URL and publishable/anonymous key in `frontend/.env.local`. Never put a service-role key, database password, Cloudflare token, SMTP password, or other secret in a `VITE_` variable.

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

- [Supabase setup](frontend/SUPABASE_SETUP.md)
- [Phases 4–22 implementation and deployment](docs/PHASES_4_22_IMPLEMENTATION.md)
- [Operations and monitoring](docs/OPERATIONS_MONITORING.md)
- [Backup and recovery](docs/BACKUP_RECOVERY.md)
- [Campus governance](docs/CAMPUS_GOVERNANCE.md)

The repository is locally hardened, but it is not a claim that the live Supabase project, Cloudflare project, monitoring providers, backups, or institutional policies are configured. Those owner-controlled gates must be verified before a limited campus beta.
