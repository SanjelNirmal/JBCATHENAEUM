import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { LoadingState } from "../components/AsyncState";
import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import { AppLayout } from "./AppLayout";

function lazyElement(
  loader: () => Promise<{ default: ComponentType }>,
  label: string,
) {
  const Component = lazy(loader);
  return (
    <Suspense fallback={<LoadingState label={label} />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: lazyElement(() => import("../pages/HomePage"), "Loading home"),
      },
      {
        path: "resources",
        element: lazyElement(
          () => import("../pages/ResourceCatalogPage"),
          "Loading catalog",
        ),
      },
      {
        path: "resources/:resourceId",
        element: lazyElement(
          () => import("../pages/ResourceDetailPage"),
          "Loading resource",
        ),
      },
      {
        path: "faculties",
        element: lazyElement(
          () => import("../pages/AcademicDirectoryPage"),
          "Loading academic directory",
        ),
      },
      {
        path: "faculties/:facultySlug",
        element: lazyElement(
          () => import("../pages/AcademicDirectoryPage"),
          "Loading faculty",
        ),
      },
      {
        path: "programs/:programSlug",
        element: lazyElement(
          () => import("../pages/AcademicDirectoryPage"),
          "Loading program",
        ),
      },
      {
        path: "subjects/:subjectSlug",
        element: lazyElement(
          () => import("../pages/AcademicDirectoryPage"),
          "Loading subject",
        ),
      },
      {
        path: "contribute",
        element: lazyElement(
          () => import("../pages/ContributePage"),
          "Loading contribution form",
        ),
      },
      {
        path: "my-submissions",
        element: lazyElement(
          () => import("../pages/MySubmissionsPage"),
          "Loading submissions",
        ),
      },
      {
        path: "notifications",
        element: lazyElement(
          () => import("../pages/NotificationsPage"),
          "Loading notifications",
        ),
      },
      {
        path: "profile",
        element: lazyElement(
          () => import("../pages/ProfilePage"),
          "Loading profile",
        ),
      },
      ...["account", "account/profile"].map((path) => ({
        path,
        element: lazyElement(
          () => import("../pages/ProfilePage"),
          "Loading profile",
        ),
      })),
      ...["account/bookmarks", "profile/bookmarks"].map((path) => ({
        path,
        element: lazyElement(
          () => import("../pages/AccountBookmarksPage"),
          "Loading bookmarks",
        ),
      })),
      ...["account/downloads", "profile/downloads"].map((path) => ({
        path,
        element: lazyElement(
          () => import("../pages/AccountDownloadsPage"),
          "Loading download history",
        ),
      })),
      ...["account/preferences", "profile/preferences"].map((path) => ({
        path,
        element: lazyElement(
          () => import("../pages/AccountPreferencesPage"),
          "Loading preferences",
        ),
      })),
      ...["account/devices", "profile/devices"].map((path) => ({
        path,
        element: lazyElement(
          () => import("../pages/AccountDevicesPage"),
          "Loading devices",
        ),
      })),
      {
        path: "login",
        element: lazyElement(
          () => import("../pages/AuthPage"),
          "Loading sign in",
        ),
      },
      {
        path: "forgot-password",
        element: lazyElement(
          () => import("../pages/PasswordPage"),
          "Loading password recovery",
        ),
      },
      {
        path: "reset-password",
        element: lazyElement(
          () => import("../pages/PasswordPage"),
          "Loading password reset",
        ),
      },
      {
        path: "admin/*",
        element: lazyElement(
          () => import("../features/admin/AdminApp"),
          "Loading administration",
        ),
      },
      ...[
        "privacy",
        "terms",
        "copyright",
        "policies/upload",
        "policies/content-removal",
        "policies/acceptable-use",
        "policies/account-deletion",
        "policies/retention",
        "policies/reporting",
      ].map((path) => ({
        path,
        element: lazyElement(
          () => import("../pages/PolicyPage"),
          "Loading policy",
        ),
      })),
      {
        path: "copyright/removal",
        element: lazyElement(
          () => import("../pages/RemovalRequestPage"),
          "Loading removal request",
        ),
      },
      {
        path: "not-found",
        element: lazyElement(() => import("../pages/NotFoundPage"), "Loading"),
      },
      {
        path: "*",
        element: lazyElement(() => import("../pages/NotFoundPage"), "Loading"),
      },
    ],
  },
]);
