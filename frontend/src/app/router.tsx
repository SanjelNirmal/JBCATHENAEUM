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
        path: "about",
        element: lazyElement(() => import("../pages/AboutPage"), "Loading about"),
      },
      {
        path: "about/review-process",
        element: lazyElement(
          () => import("../pages/AboutReviewProcessPage"),
          "Loading review process",
        ),
      },
      {
        path: "resource-requests",
        element: lazyElement(
          () => import("../pages/ResourceRequestsPage"),
          "Loading resource requests",
        ),
      },
      {
        path: "contributors",
        element: lazyElement(
          () => import("../pages/ContributorsLeaderboardPage"),
          "Loading contributor leaderboard",
        ),
      },
      {
        path: "contributors/:userId",
        element: lazyElement(
          () => import("../pages/PublicContributorPage"),
          "Loading contributor profile",
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
        path: "posts",
        element: lazyElement(
          () => import("../pages/AcademicPostsPage"),
          "Loading academic posts",
        ),
      },
      {
        path: "posts/:slug",
        element: lazyElement(
          () => import("../pages/AcademicPostDetailPage"),
          "Loading academic post",
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
        path: "auth/callback",
        element: lazyElement(
          () => import("../pages/AuthCallbackPage"),
          "Completing authentication",
        ),
      },
      {
        path: "payment/return",
        element: lazyElement(
          () => import("../pages/PaymentReturnPage"),
          "Checking payment return",
        ),
      },
      {
        path: "admin/*",
        element: lazyElement(
          () => import("../features/admin/AdminApp"),
          "Loading administration",
        ),
      },
      {
        path: "policies",
        element: lazyElement(
          () => import("../features/legal/pages/PoliciesIndexPage"),
          "Loading policies",
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
