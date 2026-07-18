# Capacitor readiness report

## Status

The web application is prepared for a future Capacitor wrapper, but Capacitor
has intentionally not been installed or initialized in this feature. The PWA
build, browser regression suite, platform adapters, and safe-area styles should
be stable before native packaging begins.

The current Vite build emits the expected `frontend/dist` directory. React
Router owns client-side navigation, so native hosting must serve `index.html`
for application routes.

## Recommended packages for a separate change

- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/android`
- `@capacitor/ios`

Do not add native plugins until their permission, privacy, and server-side
verification requirements are documented.

## Deep links and callbacks

Use the custom scheme `jbcathenaeum://` with these initial callback shapes:

- `jbcathenaeum://auth/callback`
- `jbcathenaeum://payment/return`

A callback is navigation input only. Authentication must still be established
by Supabase using a valid, single-use server-verifiable flow. A payment return
must never grant access or mark a transfer successful without backend
verification.

Universal Links/App Links should eventually mirror trusted HTTPS routes. Slugs
and callback parameters must be parsed against allowlists before navigation.

## Readiness checklist

| Area             | Current foundation                                    | Native follow-up                                                        |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| Build output     | Vite produces `frontend/dist`                         | Set Capacitor `webDir` to `dist`                                        |
| Routing          | Client-side routes and account aliases exist          | Add native fallback and deep-link listener                              |
| Auth callbacks   | Web callback route remains unchanged                  | Add scheme to Supabase redirect allowlist and verify PKCE flow          |
| Android back     | Adapter boundary exists                               | Map hardware back to modal close, history back, then app exit           |
| Safe areas       | Viewport cover and reusable inset utilities exist     | Verify with native status/navigation bars                               |
| External payment | Optional support is external and never gates access   | Open trusted banking URLs outside the WebView; verify server-side       |
| PDF opening      | Trusted Edge Function returns short-lived viewer URLs | Add a native viewer/share-sheet fallback without persisting signed URLs |
| Downloads        | Download adapter boundary exists                      | Decide app-private storage and explicit user export behavior            |
| Sharing          | Web Share/clipboard adapter exists                    | Implement Capacitor Share behind the same interface                     |
| Devices          | Own-device records and platform/version fields exist  | Register installation ID; add push token only after consent             |
| Push             | Schema foundation only; UI says delivery is inactive  | Add APNs/FCM, token rotation, revoke, permissions, and delivery service |
| App versions     | Device registration accepts an app version            | Populate native version/build number from a trusted plugin              |

## Required validation before packaging

1. Run the complete web regression suite and production build.
2. Deploy migrations and Edge Functions to an isolated Supabase project.
3. Regenerate database types from that project.
4. Verify auth and recovery callbacks on Android and iOS.
5. Test back behavior, safe areas, PDF open/download, sharing, offline recovery,
   and interrupted updates on real devices.
6. Complete Apple/Google privacy declarations and least-privilege permissions.

Playwright WebKit emulation is useful regression coverage, but it is not a
substitute for physical iPhone Safari or a packaged iOS application test.
