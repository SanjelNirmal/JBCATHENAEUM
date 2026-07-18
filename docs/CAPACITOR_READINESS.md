# Capacitor implementation status

Capacitor 8 is installed in the `frontend` workspace with generated Android and
iOS projects. Runtime integration includes strict deep links, Supabase PKCE
callbacks, Android back coordination, trusted external navigation, public-link
sharing, device registration, offline messaging, branded native assets, and
least-privilege native configuration.

Installed packages:

- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`
- `@capacitor/app`, `@capacitor/browser`, `@capacitor/share`

No filesystem, push, hardware, fingerprinting, or third-party secure-storage
plugin is present. React Router remains the navigation owner and the web/PWA
deployment remains independent.

See [MOBILE_RELEASE.md](MOBILE_RELEASE.md) for commands, architecture, redirect
URLs, signing and trusted-link setup, security/privacy inventories, paid-content
assessment, verified local results, and the real-device/store release blockers.
