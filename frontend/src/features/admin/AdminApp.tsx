import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { LoadingState } from "../../components/AsyncState";
import { MfaPanel } from "../../components/MfaPanel";
import { Seo } from "../../components/Seo";
import { canManageAcademicPosts, canReviewResources } from "../../lib/roles";
import AdminLayout from "./AdminLayout";

const Overview = lazy(() => import("./AdminOverview"));
const Reviews = lazy(() => import("./ReviewQueuePage"));
const Resources = lazy(() => import("./ResourceManagementPage"));
const Users = lazy(() => import("./UserManagementPage"));
const Academic = lazy(() => import("./AcademicStructurePage"));
const Reports = lazy(() => import("./ReportsManagementPage"));
const Audit = lazy(() => import("./AuditLogPage"));
const Newsletter = lazy(() => import("./NewsletterPage"));
const Settings = lazy(() => import("./AdminSettingsPage"));
const Notifications = lazy(
  () => import("../../pages/admin/AdminNotificationsPage"),
);
const AcademicPosts = lazy(() => import("./AdminAcademicPostsPage"));
const AcademicPostCreate = lazy(() => import("./AdminAcademicPostCreatePage"));
const AcademicPostEdit = lazy(() => import("./AdminAcademicPostEditPage"));
const AcademicPostPreview = lazy(
  () => import("./AdminAcademicPostPreviewPage"),
);
const AcademicPostCategories = lazy(
  () => import("./AdminAcademicPostCategoriesPage"),
);

export default function AdminApp() {
  const auth = useCurrentAuth();
  const location = useLocation();
  if (auth.loading)
    return (
      <main id="main-content">
        <LoadingState label="Checking administrative access" />
      </main>
    );
  if (!auth.user || !auth.profile)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  const reviewAccess = canReviewResources(auth.profile.role);
  const postAccess = canManageAcademicPosts(auth.profile.role);
  if (!reviewAccess && !postAccess) return <Navigate to="/not-found" replace />;
  if (auth.aal !== "aal2")
    return (
      <main id="main-content" className="mx-auto w-full max-w-3xl px-5 py-16">
        <Seo
          title="Administrator verification"
          description="Multi-factor verification is required."
          path={location.pathname}
          noIndex
        />
        <MfaPanel />
      </main>
    );
  return (
    <Suspense fallback={<LoadingState label="Loading administration" />}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route
            index
            element={
              reviewAccess ? (
                <Overview />
              ) : (
                <Navigate to="/admin/posts" replace />
              )
            }
          />
          <Route
            path="reviews"
            element={
              reviewAccess ? <Reviews /> : <Navigate to="/not-found" replace />
            }
          />
          <Route
            path="resources"
            element={
              reviewAccess ? (
                <Resources />
              ) : (
                <Navigate to="/not-found" replace />
              )
            }
          />
          <Route
            path="users"
            element={
              reviewAccess ? <Users /> : <Navigate to="/not-found" replace />
            }
          />
          <Route
            path="academic-structure"
            element={
              reviewAccess ? <Academic /> : <Navigate to="/not-found" replace />
            }
          />
          <Route
            path="reports"
            element={
              reviewAccess ? <Reports /> : <Navigate to="/not-found" replace />
            }
          />
          <Route
            path="newsletter"
            element={
              reviewAccess ? (
                <Newsletter />
              ) : (
                <Navigate to="/not-found" replace />
              )
            }
          />
          <Route
            path="notifications"
            element={
              reviewAccess ? (
                <Notifications />
              ) : (
                <Navigate to="/not-found" replace />
              )
            }
          />
          <Route
            path="audit-logs"
            element={
              reviewAccess ? <Audit /> : <Navigate to="/not-found" replace />
            }
          />
          <Route
            path="settings"
            element={
              reviewAccess ? <Settings /> : <Navigate to="/not-found" replace />
            }
          />
          <Route path="posts" element={<AcademicPosts />} />
          <Route path="posts/new" element={<AcademicPostCreate />} />
          <Route path="posts/:id/edit" element={<AcademicPostEdit />} />
          <Route path="posts/:id/preview" element={<AcademicPostPreview />} />
          <Route path="post-categories" element={<AcademicPostCategories />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
