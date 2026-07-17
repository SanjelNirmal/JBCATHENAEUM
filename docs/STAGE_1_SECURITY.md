# Stage 1 production hardening

Stage 1 replaces browser-trusted roles with database memberships, restricts profile exposure, removes direct newsletter writes, removes the in-app SQL editor, validates public configuration, and adds Cloudflare Pages security headers.

## Safety properties

- `profiles.role` is retained for compatibility and recovery, but no policy or frontend authorization check trusts it.
- Existing `profiles`, `resources`, and `newsletter_subscriptions` rows are preserved.
- Legacy `profiles.role` values are retained for owner review but are not copied into trusted memberships because that field was previously client-writable. Existing users receive a baseline `student` membership.
- The browser cannot insert, update, or delete `user_roles` rows.
- Only the `set_user_role` security-definer function can change memberships. It blocks privileged self-promotion, requires `super_admin` for admin-level changes, protects the final super administrator, and records an audit event.
- Anonymous visitors cannot enumerate profiles or subscribers.
- Resource writes require `admin` or `super_admin`; public resource reads remain available.
- Newsletter signup uses a validating RPC. Abuse throttling belongs at an Edge Function or Cloudflare boundary in Stage 2.

## Required public environment

Configure these in Cloudflare Pages. Values prefixed with `VITE_` are intentionally public and must never contain a service-role key or another secret.

| Variable | Required | Purpose |
|---|---:|---|
| `VITE_SUPABASE_URL` | Yes | Public Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public Supabase anonymous/publishable key |
| `VITE_APP_VERSION` | Recommended | Commit SHA or release identifier shown in System Status |
| `VITE_DEPLOYED_AT` | Recommended | ISO-8601 deployment timestamp |
| `VITE_RESOURCE_STORAGE_BUCKET` | No | Read-only Storage connectivity check; uploads are Stage 2 |

Do not configure `GEMINI_API_KEY` in the frontend build. The Vite injection that exposed it has been removed.

## Cloudflare CSP origin allowlist

Every non-self origin in `frontend/public/_headers` has a current application dependency:

| Directive | Origin | Reason |
|---|---|---|
| `connect-src` | `https://*.supabase.co` | Supabase Auth, PostgREST, and Storage HTTPS calls |
| `connect-src` | `wss://*.supabase.co` | Supabase auth/realtime WebSocket support |
| `style-src` | `https://fonts.googleapis.com` | Inter and Playfair Display stylesheet import |
| `font-src` | `https://fonts.gstatic.com` | Google Fonts files |
| `img-src` | `https://images.unsplash.com` | Home-page archive photograph |
| `frame-src` | `https://drive.google.com`, `https://docs.google.com` | Existing legacy document preview iframe |
| `frame-src` | `https://*.supabase.co` | Short-lived signed preview of validated private PDFs |

`script-src` also contains one SHA-256 hash for the static organization JSON-LD block in `frontend/index.html`; it does not authorize arbitrary inline JavaScript.

External links to Google Scholar, social networks, and the class-record site navigate away from the application and do not need CSP allowlist entries.

## Owner-run migration procedure

The migration has deliberately **not** been executed by Codex. A Supabase project owner must verify recovery first.

1. Confirm the correct Supabase project and its project reference in the dashboard.
2. In **Database → Backups**, confirm a restorable backup exists. On plans without managed backups, make a logical dump from a secured operator workstation:

   ```sh
   mkdir -p backups
   supabase login
   supabase link --project-ref <PROJECT_REF>
   supabase db dump --linked --file backups/pre-stage1-$(date +%Y%m%d-%H%M%S).sql
   ```

3. Review migration state and the proposed SQL:

   ```sh
   supabase migration list --linked
   supabase db push --linked --dry-run
   ```

4. Apply the migration:

   ```sh
   supabase db push --linked
   ```

5. Bootstrap exactly one trusted super administrator. In the Supabase dashboard SQL editor, replace the placeholder email and run this once while signed in as the project owner:

   ```sql
   begin;

   with trusted_user as (
     select id
     from auth.users
     where lower(email) = lower('TRUSTED_OWNER_EMAIL')
   ), inserted_role as (
     insert into public.user_roles (user_id, role, granted_by)
     select id, 'super_admin'::public.app_role, null
     from trusted_user
     on conflict (user_id, role) do nothing
     returning user_id
   )
   insert into public.audit_events (actor_id, action, entity_type, entity_id, metadata)
   select null, 'role.bootstrapped', 'user', id, '{"role":"super_admin"}'::jsonb
   from trusted_user
   where exists (select 1 from inserted_role);

   do $$
   begin
     if not exists (
       select 1 from public.user_roles where role = 'super_admin'::public.app_role
     ) then
       raise exception 'No super administrator was created; verify the email before committing';
     end if;
   end
   $$;

   commit;
   ```

   After bootstrap, use the application role-management RPC to re-grant `admin` only to identities the owner has verified. Do not bulk-copy legacy `profiles.role = 'admin'` values.

6. Run database policy tests from the repository root:

   ```sh
   supabase test db
   ```

7. Manually verify with two test accounts:

   - A student cannot open the admin dashboard through normal navigation.
   - A student receives RLS denial when attempting resource insert/update/delete.
   - Updating `profiles.role` through the REST API is denied.
   - A normal admin cannot grant itself `super_admin` or grant another user `admin`.
   - A super administrator can grant/revoke an admin membership, and `audit_events` records it.
   - Anonymous REST queries cannot list `profiles`, `user_roles`, `newsletter_subscriptions`, or `audit_events`.

8. Deploy to a Cloudflare preview first. Confirm `_headers` is present in the built output, sign-in works, Google Drive previews render, and the browser console shows no CSP violations for required behavior.
9. Promote the preview and verify headers:

   ```sh
   curl -I https://jbcathenaeum.pages.dev/
   curl -I https://jbcathenaeum.pages.dev/assets/<BUILT_ASSET_NAME>
   ```

## Recovery

If validation fails, stop traffic promotion. Prefer a compensating migration that restores the last reviewed policy set. If data integrity is affected, restore the verified pre-migration backup using Supabase recovery procedures. Do not recover by enabling broad `USING (true)` mutation policies or by making profiles public.

## Deferred risks

Stage 1 does not implement the Stage 2 contribution/storage pipeline, file scanning, rate limiting, anonymous analytics, resource normalization, pagination, or search indexing. Existing URL-based resource creation remains admin-only until the Stage 2 upload flow replaces it.
