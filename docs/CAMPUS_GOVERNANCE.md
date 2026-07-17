# Campus governance and policy approval

Status: application pages and workflow placeholders exist; every policy is explicitly a draft until Jana Bhawana Campus approves the owner, text, effective date, review cycle, and official contact.

## Approval register

Complete this register in the institution's controlled records system before beta. Do not add personal phone numbers or private email addresses to the public repository.

| Document/process | Required institutional owner | Required reviewers | Status |
|---|---|---|---|
| Privacy Policy | Data/privacy owner | Legal/administration, IT/security | Draft |
| Terms of Use | Campus administration | Legal, academic leadership | Draft |
| Upload Policy | Academic/content owner | Library/faculty, IT/security | Draft |
| Copyright Policy | Campus administration | Legal, library/content owner | Draft |
| Content Removal Policy | Legal/administration | Privacy, content operations | Draft |
| Acceptable Use Policy | IT/security owner | Student affairs, administration | Draft |
| Account Deletion Policy | Privacy owner | Auth/database owner, legal | Draft |
| Data Retention Policy | Records/privacy owner | Legal, database/storage owner | Draft |
| Resource Reporting Policy | Content operations owner | Student affairs, legal/security | Draft |

For each, record version, approvers, approval date, effective date, public contact, next review date, and translation/accessibility requirements.

## Operational decisions required

- Who may contribute, moderate, administer, and become super-admin.
- Whether a verified campus email or separate membership proof is required.
- Role grant/revocation approval and quarterly access-review procedure.
- Expected moderation service level and escalation path.
- Copyright/removal evidence requirements, acknowledgement deadline, decision deadline, appeal path, and preservation obligations.
- Which resource categories are allowed and which sensitive/illegal/personal content is prohibited.
- Account suspension, restoration, deletion, and appeal procedures.
- Database, audit, report, removal-request, quarantine, published-file, and deletion-job retention periods.
- Privacy basis, data-subject request process, age/student considerations, and cross-border vendor approval.
- Whether Cloudflare, Supabase, monitoring, email, and backup vendors are institutionally approved.

## Removal-request workflow

The public `/copyright/removal` page sends structured data to `submit-removal-request`. The function validates bounded fields and HTTPS evidence, hashes the client address with a secret salt, enforces a 15-minute cooldown, optionally verifies Turnstile, and calls a service-only RPC. Administrators can resolve/dismiss requests with a required note; audit events store the request ID and outcome, not the complete private request body.

Until policy approval:

- Treat submissions as requests for review, not automatic takedown or a legal conclusion.
- Restrict queue access to authorized administrators with MFA.
- Do not publish requester identity.
- Preserve the audit trail and apply the approved retention period.
- Escalate urgent safety or legal matters to the named institutional owner.

## Launch gates

Limited beta requires signed policy ownership, live RLS/Storage verification, staff MFA enrollment, backup plus Storage export verification, monitoring contacts, an isolated restore drill, and acceptance tests with distinct roles.

Campus-wide deployment additionally requires a successful limited beta, reviewed incident/recovery results, security review, accessibility review including manual keyboard/screen-reader checks, operational capacity approval, and final published policy versions.
