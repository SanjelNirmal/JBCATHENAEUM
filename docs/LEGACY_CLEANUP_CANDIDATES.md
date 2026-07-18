# Legacy cleanup candidates

This report is intentionally separate from the account-engagement/PWA feature.
No listed file was deleted or broadly rewritten.

## Suspected disconnected component cluster

| File                                              | Lines | Evidence                                                      |
| ------------------------------------------------- | ----: | ------------------------------------------------------------- |
| `frontend/src/components/AdminDashboard.tsx`      |   816 | Not referenced by the active router; imports legacy `Toast`   |
| `frontend/src/components/Footer.tsx`              |   304 | Active layout imports `SiteFooter` instead                    |
| `frontend/src/components/Header.tsx`              |   802 | Active layout imports `SiteHeader` instead                    |
| `frontend/src/components/Hero.tsx`                |   120 | No imports outside the legacy cluster                         |
| `frontend/src/components/InfoView.tsx`            |   405 | No active route/import reference                              |
| `frontend/src/components/LibraryArchivesView.tsx` |    68 | No active route/import reference                              |
| `frontend/src/components/LoginModal.tsx`          |   155 | Auth is routed through `AuthPage`; no active import reference |
| `frontend/src/components/NoteViewer.tsx`          |   230 | No active route/import reference                              |
| `frontend/src/components/ResourcesView.tsx`       |   124 | Catalog uses `ResourceCatalogPage`; no active route reference |
| `frontend/src/components/SemestersView.tsx`       |   105 | No active route/import reference                              |
| `frontend/src/components/Toast.tsx`               |    61 | Referenced only by legacy `AdminDashboard`                    |

The files total 3,190 lines. Evidence was collected with repository-wide import
and router searches; filename mentions inside the files themselves were
excluded. This is strong dead-code evidence, not proof that no external consumer
exists.

## Test implications

- The active route suite does not instantiate this cluster.
- Removing it could expose old tests, CSS assumptions, or compatibility imports
  not visible to static route search.
- `ContributeView` and its compatibility API remain active and are not cleanup
  candidates in this report.

## Recommended removal order for a separate commit

1. Add a temporary import/reference check to CI and run production build.
2. Remove leaf views with no imports: `Hero`, `InfoView`,
   `LibraryArchivesView`, `LoginModal`, `NoteViewer`, `ResourcesView`, and
   `SemestersView`.
3. Remove legacy `Header` and `Footer` after comparing active layout behavior.
4. Remove `AdminDashboard` and then its private `Toast` dependency.
5. Run auth, contribution, moderation, resource, admin, accessibility, and
   browser regression suites before committing the cleanup.
