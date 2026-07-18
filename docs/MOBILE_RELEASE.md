# JBC Athenaeum mobile foundation and release runbook

Last reviewed: 2026-07-18

## Implemented foundation

Capacitor is owned by the `frontend` workspace. Run every `cap` command from
`frontend/`; `capacitor.config.ts` uses `webDir: "dist"`. The web/PWA build
remains independent and continues to be published from the root build output.

Installed packages:

- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, and
  `@capacitor/ios` 8.4.2
- `@capacitor/app` 8.1.1 for cold/warm deep links and Android hardware back
- `@capacitor/browser` 8.0.4 for allowlisted external HTTPS content
- `@capacitor/share` 8.0.1 for public resource links only

No filesystem, camera, microphone, location, contacts, push, advertising,
analytics, device-fingerprinting, or third-party secure-storage plugin is
installed.

The Android application ID and iOS bundle identifier are both:

```text
np.com.nirmalsanjel.jbcathenaeum
```

An exact indexed-web/store search found no match for that identifier or exact
app name on 2026-07-18. This is not a reservation: create the records in Play
Console and App Store Connect before release to establish availability.

## Commands and layout

From the repository root, the web remains deployable with:

```sh
npm run build
```

From `frontend/`:

```sh
npm run cap:sync
npx cap sync android
npx cap open android
npx cap sync ios
npx cap open ios
```

`cap:sync`, `cap:android`, `cap:ios`, and `cap:copy` use `vite build --mode
native`. Native mode does not generate a service worker. The web build still
generates and prompts for the PWA worker. Native startup also removes any
unexpected WebView worker registration.

```text
frontend/
├── android/                     Android Studio project
├── ios/                         Xcode Swift Package Manager project
├── native-links/.well-known/    trusted-link templates with placeholders
├── resources/                   high-resolution icon/splash masters
├── src/platform/                adapter, deep-link, platform, and back boundary
├── capacitor.config.ts
├── dist/
└── package.json
```

Do not deploy `native-links/.well-known/` as-is. Its explicit placeholders
intentionally prevent false verification claims.

## Navigation and trusted links

React Router and clean URLs remain the navigation owner. Native links pass
through a strict allowlist. Arbitrary URLs, credentials, fragments,
`javascript:`, `data:`, `file:`, lookalike hosts, open redirects, malformed
slugs, and unexpected query keys are rejected or discarded.

Supported links:

```text
jbcathenaeum://auth/callback
jbcathenaeum://payment/return
jbcathenaeum://resources/{slug}
jbcathenaeum://account/notifications

https://jbc.nirmalsanjel.com.np/auth/callback
https://jbc.nirmalsanjel.com.np/payment/return
https://jbc.nirmalsanjel.com.np/resources/{slug}
```

Android custom-scheme/App Link intent filters and the iOS custom scheme are
configured. The iOS Associated Domains entitlement contains
`applinks:jbc.nirmalsanjel.com.np`.

Android App Links are **not verified yet**. Obtain the SHA-256 fingerprint from
the real release/app-signing certificate, replace the placeholder in
`frontend/native-links/.well-known/assetlinks.json`, and deploy it as
`https://jbc.nirmalsanjel.com.np/.well-known/assetlinks.json` with JSON content
type and no redirect. Then verify a signed build.

iOS Universal Links are **not verified yet**. Replace the Apple Team ID in the
extensionless `apple-app-site-association` template, deploy it at the same
`/.well-known/` site path with JSON content type and no redirect, enable the
capability for the signed App ID, and test a release-signed physical device.

## Supabase PKCE authentication and storage

Add these exact values to the live Supabase Auth redirect allowlist:

```text
https://jbc.nirmalsanjel.com.np/auth/callback
jbcathenaeum://auth/callback
```

Local development additionally uses:

```text
http://localhost:3000/auth/callback
```

Signup verification and password recovery return through the callback route.
It waits briefly for Supabase's URL detector, explicitly exchanges an
unconsumed PKCE code after native navigation, verifies a real session, and then
replaces the route. Codes/errors are removed from history immediately and are
never logged. Recovery continues only with a valid session. Cancelled, invalid,
missing, and expired callbacks show a generic failure.

Only `VITE_SUPABASE_URL` and the public anonymous/publishable key are bundled.
Never place the service-role key in a frontend/mobile variable.

Session persistence currently uses Capacitor WebView `localStorage`. This is
explicitly **not** Android Keystore or iOS Keychain. Android backups are
disabled to reduce unintended session copy. Before sensitive commercial
release, choose a maintained secure-storage implementation, document stored
fields/privacy, migrate transactionally from WebView storage, and test refresh,
logout, revocation, reinstall, upgrade, and rollback. Supabase logout removes
the local Auth session. The random installation ID remains because it is not an
authentication credential.

## Back, external links, safe areas, and system UI

Android back behavior is:

1. dismiss the most recently opened focus-managed modal, sheet, or drawer;
2. navigate back through React Router history;
3. replace a cold deep-link detail route with home when no history exists;
4. exit only from home with no dismissible UI.

Only the App listener handles native back. Existing safe-area utilities remain
authoritative for notch, Dynamic Island, home indicator, Android system bars,
dialogs, drawers, toasts, bottom navigation, and landscape. Capacitor 8
edge-to-edge behavior uses CSS `env()` insets; no duplicate status-bar plugin
was installed. Native colors use navy `#002147` and surface `#F8FAFC`.

Native HTTPS opening is allowlisted to public JBC domains, the configured
Supabase host, existing Google document hosts, and known public social/
documentation hosts. `mailto:` and `tel:` delegate to the OS. Unsupported
user-controlled URLs are ignored. Supported internal JBC links remain in React
Router.

## PDF, downloads, sharing, offline, and devices

The existing trusted `resource-download` Edge Function remains the source of
short-lived viewer URLs. It performs server-side resource/version checks,
records signed-in history, sends `Cache-Control: private, no-store`, and never
bundles private PDFs. Native document opening requests a fresh URL and uses the
system-secured browser fallback. Viewer URLs remain only in memory and are
never logged, shared, named, or persisted.

The first native release is view-only. No Filesystem plugin or public storage
permission exists; there is no automatic permanent/app-private download,
export, print, or offline entitlement. A future implementation needs backend
per-resource permission, version tracking, safe generated filenames, expiry
cleanup, and app-private storage before installing Filesystem.

Native Share accepts only canonical public
`https://jbc.nirmalsanjel.com.np/resources/{slug}` links with public title and
description. It rejects signed URLs, query strings, fragments, tokens, and
private paths.

The packaged shell is local. An offline banner explains that account checks and
protected documents need connectivity. Supabase Auth/REST/Functions/Storage and
signed PDFs remain network-only; stale entitlements are not trusted. No private
offline PDF cache exists.

The Devices page uses authenticated user ID, a cryptographically random
installation UUID, platform, non-invasive label, app version/build, no push
token, and server timestamp. RLS protects records and users can remove their own
devices. It collects no serial, advertising ID, location, contacts, or device
fingerprint. Push notifications are **not implemented**: there is no APNs/FCM
capability, permission, token, Firebase file, background mode, or delivery
service.

## Native release configuration

Android uses min SDK 24, compile/target SDK 36, version 1.0/code 1, a single-task
exported launcher with explicit URL filters, cleartext/mixed content disabled,
WebView debugging tied to `BuildConfig.DEBUG` (off in release), backups
disabled, and R8/resource shrinking enabled. Only
`android.permission.INTERNET` is requested. No broad storage/hardware
permission or unused FileProvider is present. Keep release keystores/passwords
outside Git; prefer Play App Signing and record both upload/app-signing
fingerprints.

iOS uses deployment target 15.0, version/build 1.0/1, phone/iPad portrait and
landscape, ATS with arbitrary loads disabled, custom scheme, Associated Domains
entitlement, branded light/dark LaunchScreen assets and AppIcon, and no hardware privacy usage
descriptions. In Xcode, select the owner Team and explicit App ID, confirm
Associated Domains, sign Release, archive, validate, and distribute. Do not
invent or commit Team IDs or signing material.

## Environment and bundle audit

Client-safe variables are documented in `frontend/.env.example`: Supabase URL
and public key, canonical app URL, environment name, public app/deployment
version, bucket name, and the native external-payment flag. Keep that flag
`false` for release.

Never bundle service-role/payment-provider secrets, SMTP/database passwords,
private API keys, signing keys, certificates, or keystore passwords.

Before every upload:

```sh
cd frontend
npm run cap:sync
rg -n -i "service[_-]?role|smtp.*password|database.*password|private[_-]?key|payment.*secret|localhost|/Users/" dist android/app/src/main/assets ios/App/App/public
find dist android/app/src/main/assets ios/App/App/public -type f -iname "*.pdf"
```

Review every hit. Public anonymous keys are expected. Secret keys, local paths,
active non-test localhost endpoints, private PDFs, and provider secrets are
release failures. Vite production source maps are disabled by default.

## Privacy inventory

This describes implemented behavior, not future plans. Confirm live Supabase,
Cloudflare, email, and monitoring behavior before submitting store answers.

| Data category                             | Current state                 | Purpose                                                   |
| ----------------------------------------- | ----------------------------- | --------------------------------------------------------- |
| Name                                      | Account-linked                | Profile/display and contribution attribution              |
| Email                                     | Account-linked                | Supabase authentication, verification, recovery           |
| User ID                                   | Account-linked                | RLS ownership, accounts, moderation, audit                |
| Authentication info                       | Collected                     | Supabase session/refresh material; WebView storage today  |
| User content                              | Optional                      | PDF uploads, metadata, reports/removal requests           |
| Purchase history                          | Not collected                 | Paid document access is not implemented                   |
| Device identifier                         | Optional/account-linked       | Random installation ID after registration                 |
| Product interaction                       | When used/account-linked      | Downloads, bookmarks, ratings, notifications              |
| Diagnostics                               | Local event in current client | Sanitized category/path/version; verify any live receiver |
| Push token                                | Not collected                 | Push is not implemented                                   |
| Location, contacts, camera, photos, audio | Not collected                 | No permission or feature                                  |
| Tracking/advertising ID                   | Not collected                 | No ads SDK, ATT request, or fingerprint                   |

For Apple App Privacy, review contact info, identifiers, user content, product
interaction/usage records, authentication information, and diagnostics only if
a live receiver collects it. Mark data linked where stored against the account;
do not claim tracking unless cross-company tracking is added.

For Google Data Safety, disclose the same transmitted account/user-content/
interaction data, encryption in transit, and Supabase processing. The privacy
policy URL is `https://jbc.nirmalsanjel.com.np/privacy`; the policy URL for
deletion is `https://jbc.nirmalsanjel.com.np/policies/account-deletion`.

Release blocker: the app can create accounts but does not yet provide a complete
in-app authenticated account-deletion request/execution flow or confirmed web
request endpoint. Implement/test it before store submission; do not describe
the policy page alone as an operational deletion mechanism.

Google Play preparation also requires accurate Data Safety answers, account
deletion URL, app-access/reviewer account instructions, content rating, target
audience, and permission declaration. Apple requires accurate App Privacy
answers, privacy URL, account deletion, sign-in/reviewer access, tracking
declaration, export compliance, and review notes.

## Paid digital content assessment

Proposed paid PDF access is digital content consumed in-app. That normally
falls under Apple App Review Guideline 3.1 and Google Play Payments rules.
Apple reader-app rules may permit access to previously purchased book content
and specific regional/external-link entitlements, but are not blanket permission
for eSewa, Khalti, bank QR, or web-purchase steering. Google normally requires
Play Billing for in-app digital content, subject to enrolled country/program
alternatives with exact disclosures.

Re-check immediately before release:

- https://developer.apple.com/app-store/review/guidelines/
- https://support.google.com/googleplay/android-developer/answer/9858738
- https://support.google.com/googleplay/android-developer/answer/10281818

Therefore `VITE_NATIVE_EXTERNAL_PAYMENTS_ENABLED=false` is release-blocking and
native resource opening skips the optional web donation prompt. Users may
access authorized free/existing entitlements. No callback, browser close, query
parameter, client amount, or client code can create a paid entitlement. A paid
release requires SKU classification, StoreKit/Play Billing or an approved
regional program, backend receipt verification, restore purchases, refunds/
revocation, legal/tax review, and fresh policy review.

## Test status and release blockers

Verified locally on 2026-07-18:

- Node 24.15.0 and npm 11.12.1 satisfy Capacitor 8's Node 22+ requirement.
- Root TypeScript/backend syntax lint passed.
- Frontend unit/integration tests: 23 files, 120 tests passed.
- Backend tests: 1 file, 3 tests passed.
- Public Playwright regression: 42 passed and 7 intentionally skipped across
  Chromium, Firefox, WebKit, Pixel 5, iPhone SE, iPhone 13, and iPhone 15 Pro
  browser profiles. This is browser emulation, not packaged-app simulation.
- Production web/PWA build passed and generated its service worker.
- Native-mode Vite build and `cap sync` passed for Android and iOS; native
  bundles contained zero service-worker files.
- Plist, entitlements, Android XML, and trusted-link template syntax passed.
- Production dependency audit reported zero vulnerabilities.
- Bundle scan found zero high-risk secret-pattern files, private PDFs, source
  maps, or developer filesystem paths. Six duplicated `http://localhost`
  strings are inert vendor constants from React Router's URL fallback and
  Supabase Auth's emulator constant; neither is an application-configured
  endpoint. Capacitor's internal `https://localhost` WebView origin is expected.
- Android Gradle debug compilation passed with Android Studio's bundled
  OpenJDK 21.0.10. The optimized, resource-shrunk/R8 unsigned Release APK also
  compiled successfully. `lintDebug` and `testDebugUnitTest` passed after the
  API-27-only system-bar attributes were moved to version-qualified resources.
  The local artifacts were `app-debug.apk` (23 MB) and
  `app-release-unsigned.apk` (16 MB); build outputs are ignored and are not
  release-signed deliverables.
- iOS compilation was attempted but could not start because full Xcode is not
  installed/selected (only Command Line Tools are active).
- No live Supabase PKCE callback, Android emulator, Android physical device,
  iOS simulator, or physical iPhone test was performed.

This repository can be built/synchronized without claiming native device
results. Before release:

1. configure the real Android release/app-signing key, produce and validate a
   signed AAB, and run the emulator/physical-device matrix; keep Android Studio,
   SDK 36, and its command-line tools aligned when the local SDK is updated;
2. install full Xcode 26+, resolve SPM, build/archive, and run the simulator/
   physical-iPhone matrix;
3. configure signing and deploy/verify both trusted-link files;
4. configure live Supabase redirects and test signup, recovery, expiry,
   cancellation, cold/warm start, MFA, and logout on both platforms;
5. implement account deletion and secure session-storage migration;
6. keep paid controls disabled until store-policy/billing compliance;
7. verify live privacy declarations, support/review access, content rating,
   target audience, export compliance, and store review notes;
8. repeat PDF expiry, offline recovery, rotation, resume, modal/drawer back,
   resource, share, and external-link tests on real devices.

No emulator, simulator, Android physical-device, or physical-iPhone result may
be claimed until those tests are actually performed.
