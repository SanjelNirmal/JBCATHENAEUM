import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { LoadingState } from "../../components/AsyncState";
import { MfaPanel } from "../../components/MfaPanel";
import { Seo } from "../../components/Seo";
import { canReviewResources } from "../../lib/roles";
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
const Notifications = lazy(() => import("../../pages/admin/AdminNotificationsPage"));

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
  if (!canReviewResources(auth.profile.role))
    return <Navigate to="/not-found" replace />;
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
          <Route index element={<Overview />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="resources" element={<Resources />} />
          <Route path="users" element={<Users />} />
          <Route path="academic-structure" element={<Academic />} />
          <Route path="reports" element={<Reports />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="audit-logs" element={<Audit />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
