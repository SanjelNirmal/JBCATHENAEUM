# Operations and monitoring

Status: implementation hooks and runbook are present; no external monitoring service is claimed as configured.

## Ownership

Assign named people before beta:

- Service owner: deployment approval, incident commander, vendor access.
- Database owner: migrations, query health, backups, restore drills.
- Content operations owner: moderation backlog, reports, removal requests.
- Security/privacy owner: access review, incident classification, disclosure decisions.
- Secondary/on-call contact: acts when the primary is unavailable.

Store names and contact details in the institution's restricted operations system, not this public repository.

## Signals and initial alert thresholds

| Signal | Source | Initial threshold | Response |
|---|---|---:|---|
| Public availability | External HTTPS monitor on `/` and `/resources` | 2 failures across 5 minutes | Check Cloudflare deployment, DNS, then Supabase status |
| Browser errors | `jbc:client-error` sanitized event connected to an approved error provider | More than 1% affected sessions or 5/minute | Triage by deployment version; never attach tokens or private URLs |
| API/database errors | Supabase Edge Function/Postgres logs | More than 5% errors for 5 minutes | Inspect function name/code and recent migration; pause promotion |
| Failed uploads | `admin_dashboard_metrics.failedUploads` and `resource_upload_sessions` | 5 new failures in 15 minutes | Check size/signature/scan errors and Storage health |
| Storage cleanup | `pendingStorageCleanup` and `resource_deletion_jobs` | Any failed job older than 30 minutes | Verify cron secret/invocation; retry cleanup; never recreate a deleted public row |
| Moderation backlog | submitted/under-review count and oldest submission | More than 50 or oldest over 72 hours | Assign reviewers and notify content operations owner |
| Flagged/removal content | reports/removal queue | Any urgent safety/copyright report unacknowledged for 24 hours | Follow the approved removal policy and preserve audit history |
| Storage use | Sum of managed `resource_versions.byte_size` plus provider dashboard | 70%, 85%, 95% of approved budget | Forecast, clean safe orphans, increase capacity only with approval |
| Authentication failures | Supabase Auth logs | Unusual spike or repeated target account failures | Investigate abuse; do not log submitted passwords |
| Deployment health | System Settings version/time plus Cloudflare deployments | Version differs from approved release | Stop beta traffic and roll back frontend if appropriate |

Tune thresholds after two weeks of limited-beta baseline data.

## Configuration procedure

1. In Cloudflare Dashboard → Workers & Pages → JBC Athenaeum → Metrics, enable Web Analytics. Cloudflare documents that Pages inserts the analytics beacon on the next deployment: <https://developers.cloudflare.com/pages/how-to/web-analytics/>.
2. Create an external uptime monitor with 5-minute checks for the production home and catalog. Alert the primary and secondary owner; do not use a signed resource URL as a target.
3. Select an institution-approved error provider. Subscribe to the `window` event named `jbc:client-error` and transmit only its already-sanitized fields (`kind`, bounded message, path, version, timestamp). Record its DSN/endpoint as a deployment secret only if the provider's client key is designed to be public.
4. Configure Supabase log drains/alerts according to the project's plan for Edge Function 5xx, Auth failures, and Postgres errors. Redact authorization headers and request bodies.
5. Schedule the cleanup function every 15 minutes, then create a monitor that alerts when the invocation fails or a deletion job remains failed for 30 minutes.
6. Add a daily content-operations check for pending reviews, reports, and removal requests. Add a weekly storage/capacity review.

## Safe diagnostic queries

Run only from an owner-controlled database session:

```sql
select status, count(*), min(submitted_at) as oldest
from public.resource_submissions
where status in ('submitted', 'under_review')
group by status;

select failure_code, count(*), max(updated_at) as latest
from public.resource_upload_sessions
where failure_code is not null
group by failure_code;

select status, count(*), min(created_at) as oldest, max(attempts) as max_attempts
from public.resource_deletion_jobs
where status in ('pending', 'failed')
group by status;
```

## Logging restrictions

Never record passwords, MFA codes, access/refresh tokens, cookies, service-role keys, database passwords, raw private Storage URLs/paths, complete removal-request bodies, or unnecessary personal data. Use audit IDs, resource IDs, failure codes, counts, time windows, and the sanitized deployment version.

## Incident sequence

1. Acknowledge and name the incident commander.
2. Preserve relevant Cloudflare/Supabase logs and audit event IDs without copying secrets.
3. Contain: pause promotion, disable only the affected workflow, revoke compromised credentials, or roll back the frontend. Do not disable RLS.
4. Assess data/security impact and follow institutional notification rules.
5. Recover from a known-good deployment/backup and run smoke, RLS, upload, review, and download checks.
6. Document timeline, root cause, scope, decisions, and corrective work; schedule a blameless review.

Cloudflare Pages supports rollback to a prior successful production deployment; preview deployments are not rollback targets: <https://developers.cloudflare.com/pages/configuration/rollbacks/>.
