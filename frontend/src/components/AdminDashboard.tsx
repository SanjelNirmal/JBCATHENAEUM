// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Settings,
  Database,
  Trash2,
  AlertTriangle,
  Shield,
  Mail,
  Copy,
  Send,
  ClipboardCheck,
  Eye,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  claimResourceReview,
  decideResourceReview,
  deleteResource,
  fetchReviewQueue,
  getReviewFileUrl,
  publishApprovedResource,
  ReviewQueueItem,
  UserProfile,
  fetchUsers,
  updateUserRole,
  fetchSubscribers,
} from "../lib/api";
import { useResourcesData } from "../lib/api";
import { Toast, ToastType } from "./Toast";
import { AnimatePresence } from "motion/react";
import { SystemStatusPanel } from "./admin/SystemStatusPanel";

type NewsletterSubscriber = {
  id: string;
  email: string;
  created_at: string;
};

const defaultNewsletterSubject = "JBC ATHENAEUM | New academic resources added";

const defaultNewsletterBody = `Greetings Scholar,

New academic resources have been added to the JBC ATHENAEUM archive.

Latest additions:
- New project and PDF resources
- Faculty notes and reference materials
- Exam preparation resources

Open the archive:
https://jbc.nirmalsanjel.com.np/

Warm regards,
JBC ATHENAEUM`;

export function AdminDashboard({ canAdminister }: { canAdminister: boolean }) {
  const [activeTab, setActiveTab] = useState<
    "reviews" | "notes" | "users" | "subscribers" | "settings"
  >("reviews");
  const { resources, refresh } = useResourcesData();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState(
    defaultNewsletterSubject,
  );
  const [newsletterBody, setNewsletterBody] = useState(defaultNewsletterBody);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewAction, setReviewAction] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
    if (activeTab === "subscribers") {
      loadSubscribers();
    }
    if (activeTab === "reviews") {
      void loadReviews();
    }
  }, [activeTab]);

  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      setReviewQueue((await fetchReviewQueue()).items);
    } catch (error) {
      console.error(error);
      showToast("Failed to load the review queue.", "error");
    } finally {
      setLoadingReviews(false);
    }
  };

  const previewReviewFile = async (versionId: string) => {
    try {
      const signedUrl = await getReviewFileUrl(versionId);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      showToast("Validated review file could not be opened.", "error");
    }
  };

  const claimReview = async (submissionId: string) => {
    setReviewAction(submissionId);
    try {
      await claimResourceReview(submissionId);
      await loadReviews();
      showToast("Submission claimed for review.", "success");
    } catch (error) {
      console.error(error);
      showToast(
        "The submission could not be claimed. Self-review is prohibited.",
        "error",
      );
    } finally {
      setReviewAction(null);
    }
  };

  const decideReview = async (
    item: ReviewQueueItem,
    outcome: "approved" | "changes_requested" | "rejected",
  ) => {
    const explanation =
      outcome === "approved"
        ? (window.prompt(
            "Optional reviewer comment:",
            "Validated PDF and academic metadata reviewed.",
          ) ?? "")
        : (window.prompt(
            outcome === "rejected" ? "Rejection reason:" : "Required changes:",
          ) ?? "");
    if (outcome !== "approved" && explanation.trim().length < 3) return;
    setReviewAction(item.submissionId);
    try {
      await decideResourceReview(item.submissionId, outcome, explanation);
      if (outcome === "approved" && canAdminister) {
        const result = await publishApprovedResource(item.resourceId);
        showToast(
          result.cleanupPending
            ? "Published; quarantine cleanup is queued."
            : "Resource approved and published.",
          "success",
        );
      } else if (outcome === "approved") {
        showToast(
          "Resource approved and awaiting administrator publication.",
          "success",
        );
      } else {
        showToast(
          outcome === "rejected"
            ? "Submission rejected."
            : "Changes requested.",
          "success",
        );
      }
      await loadReviews();
      refresh();
    } catch (error) {
      console.error(error);
      showToast(
        "Review action failed. Claim the submission first and verify your permissions.",
        "error",
      );
    } finally {
      setReviewAction(null);
    }
  };

  const publishReview = async (item: ReviewQueueItem) => {
    setReviewAction(item.submissionId);
    try {
      const result = await publishApprovedResource(item.resourceId);
      showToast(
        result.cleanupPending
          ? "Published; quarantine cleanup is queued."
          : "Approved resource published.",
        "success",
      );
      await loadReviews();
      refresh();
    } catch (error) {
      console.error(error);
      showToast(
        "The approved resource could not be promoted to published Storage.",
        "error",
      );
    } finally {
      setReviewAction(null);
    }
  };

  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const data = await fetchSubscribers();
      setSubscribers(data as NewsletterSubscriber[]);
    } catch (err: any) {
      console.error(err);
      if (
        err.message?.includes(
          'relation "newsletter_subscriptions" does not exist',
        )
      ) {
        showToast(
          "Database Error: 'newsletter_subscriptions' table not found. Please run the SQL in SUPABASE_SETUP.md",
          "error",
        );
      } else {
        showToast("Failed to fetch newsletter subscribers.", "error");
      }
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const subscriberEmails = subscribers.map((subscriber) => subscriber.email);
  const subscriberList = subscriberEmails.join(",");

  const copyNewsletterText = async (label: string, value: string) => {
    if (!value.trim()) {
      showToast(`No ${label.toLowerCase()} to copy.`, "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copied.`, "success");
    } catch (error) {
      console.error(error);
      showToast(
        "Copy failed. Select the text manually and copy it from the field.",
        "error",
      );
    }
  };

  const composeNewsletter = () => {
    if (subscriberEmails.length === 0) {
      showToast("No newsletter subscribers are available.", "error");
      return;
    }

    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(
      subscriberList,
    )}&subject=${encodeURIComponent(
      newsletterSubject.trim() || defaultNewsletterSubject,
    )}&body=${encodeURIComponent(newsletterBody.trim())}`;

    if (mailtoUrl.length > 1800) {
      showToast(
        "Subscriber list is large. Copy BCC, subject, and body into your email app manually.",
        "info",
      );
      return;
    }

    window.location.href = mailtoUrl;
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast(
        "Failed to fetch user directory. Check database connectivity.",
        "error",
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateRole = async (user: UserProfile) => {
    const shouldGrant = !user.roles.includes("admin");
    const action = shouldGrant ? "grant" : "revoke";
    if (
      !window.confirm(
        `${action === "grant" ? "Grant" : "Revoke"} the admin role for this user?`,
      )
    )
      return;

    try {
      await updateUserRole(user.id, "admin", shouldGrant);
      await loadUsers();
      showToast(
        `Admin role ${action === "grant" ? "granted" : "revoked"} successfully`,
        "success",
      );
    } catch (err: unknown) {
      console.error(err);
      showToast(
        "Role change was denied. Privileged role changes require a super administrator.",
        "error",
      );
    }
  };

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;
    setIsDeleting(id);
    try {
      await deleteResource(id);
      showToast("Resource archived successfully", "success");
      refresh();
    } catch (err: any) {
      console.error(err);
      if (
        err?.code === "42501" ||
        err?.message?.includes("row-level security")
      ) {
        showToast(
          "Permission denied: only an authorized administrator can archive resources.",
          "error",
        );
      } else {
        showToast("Failed to archive resource", "error");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-serif font-bold text-[#002147]">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 mt-2">
          Manage library archives, users, and system settings.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
              activeTab === "reviews"
                ? "bg-[#002147] text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ClipboardCheck size={18} />
            <span className="font-medium text-sm">Review Queue</span>
          </button>
          {canAdminister && (
            <button
              onClick={() => setActiveTab("notes")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === "notes"
                  ? "bg-[#002147] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Database size={18} />
              <span className="font-medium text-sm">Review Notes</span>
            </button>
          )}

          {canAdminister && (
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === "users"
                  ? "bg-[#002147] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Users size={18} />
              <span className="font-medium text-sm">Manage Users</span>
            </button>
          )}

          {canAdminister && (
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === "subscribers"
                  ? "bg-[#002147] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Mail size={18} />
              <span className="font-medium text-sm">Newsletter</span>
            </button>
          )}

          {canAdminister && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                activeTab === "settings"
                  ? "bg-[#002147] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Settings size={18} />
              <span className="font-medium text-sm">System Status</span>
            </button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === "reviews" && (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-6">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-[#002147]">
                    <ClipboardCheck size={20} className="text-[#c49b63]" />{" "}
                    Secure Review Queue
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Only PDFs that passed quarantine validation appear here.
                  </p>
                </div>
                <button
                  onClick={() => void loadReviews()}
                  disabled={loadingReviews}
                  className="rounded-full p-2 text-slate-500 hover:bg-white"
                  title="Refresh review queue"
                >
                  <RefreshCw
                    size={17}
                    className={loadingReviews ? "animate-spin" : ""}
                  />
                </button>
              </div>
              {loadingReviews ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  Loading validated submissions…
                </div>
              ) : reviewQueue.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No submissions are waiting for review.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviewQueue.map((item) => (
                    <article key={item.submissionId} className="p-6">
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {item.title}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${item.status === "submitted" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}
                            >
                              {item.status.replace("_", " ")}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                              {item.scanStatus}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {item.faculty ?? "Program"} ·{" "}
                            {item.semester ?? "Term"} ·{" "}
                            {item.subject ?? "Subject"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.pageCount ?? "—"} pages ·{" "}
                            {item.byteSize
                              ? `${(item.byteSize / 1_048_576).toFixed(2)} MB`
                              : "Unknown size"}{" "}
                            · Submitted{" "}
                            {new Date(item.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              void previewReviewFile(item.versionId)
                            }
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            <Eye size={15} /> Preview
                          </button>
                          {item.status === "submitted" ? (
                            <button
                              onClick={() =>
                                void claimReview(item.submissionId)
                              }
                              disabled={reviewAction === item.submissionId}
                              className="rounded-lg bg-[#002147] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Claim review
                            </button>
                          ) : item.status === "approved" ? (
                            canAdminister ? (
                              <button
                                onClick={() => void publishReview(item)}
                                disabled={reviewAction === item.submissionId}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} /> Publish
                              </button>
                            ) : (
                              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                                Awaiting administrator publication
                              </span>
                            )
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  void decideReview(item, "approved")
                                }
                                disabled={reviewAction === item.submissionId}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button
                                onClick={() =>
                                  void decideReview(item, "changes_requested")
                                }
                                disabled={reviewAction === item.submissionId}
                                className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Request changes
                              </button>
                              <button
                                onClick={() =>
                                  void decideReview(item, "rejected")
                                }
                                disabled={reviewAction === item.submissionId}
                                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                  <FileText size={20} className="text-[#c1121f]" />
                  Uploaded Resources
                </h2>
                <span className="text-xs text-slate-500">
                  New resources enter through the secure contribution workflow.
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((resource) => (
                      <tr
                        key={resource.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">
                            {resource.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {resource.author_name} •{" "}
                            {new Date(resource.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {resource.subject}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 uppercase tracking-widest">
                            {resource.resource_type || "PDF"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDelete(resource.id)}
                              className="p-2 text-slate-400 hover:text-[#c1121f] hover:bg-red-50 rounded transition-colors"
                              title="Delete Resource"
                              disabled={isDeleting === resource.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {resources.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-8 text-center text-slate-500 italic"
                        >
                          No resources uploaded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                    <Users size={20} className="text-[#c49b63]" />
                    User Accounts
                  </h2>
                  <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {users.length} Total Users
                  </div>
                </div>
                <button
                  onClick={loadUsers}
                  disabled={loadingUsers}
                  className="p-2 text-slate-400 hover:text-[#002147] hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
                  title="Refresh Users"
                >
                  <Database
                    size={16}
                    className={loadingUsers ? "animate-spin" : ""}
                  />
                </button>
              </div>

              <div className="overflow-x-auto">
                {loadingUsers ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">
                      Loading user directory...
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Faculty</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[#002147] font-bold text-xs">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800">
                                  {user.name}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  Joined{" "}
                                  {new Date(
                                    user.created_at,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-600">
                              {user.faculty || "Unspecified"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                                user.roles.some(
                                  (role) =>
                                    role === "admin" || role === "super_admin",
                                )
                                  ? "bg-red-50 text-red-600 border border-red-100"
                                  : "bg-blue-50 text-[#002147] border border-blue-100"
                              }`}
                            >
                              {user.roles.join(", ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateRole(user)}
                                className="p-2 text-slate-400 hover:text-[#c49b63] hover:bg-amber-50 rounded transition-colors"
                                title={
                                  user.roles.includes("admin")
                                    ? "Revoke admin role"
                                    : "Grant admin role"
                                }
                              >
                                <Shield size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-12 text-center text-slate-500 italic"
                          >
                            No user profiles found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="p-4 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold uppercase tracking-tight mr-1">
                    Note:
                  </span>
                  Role changes use the audited database function. Only a super
                  administrator can grant or revoke admin and super-admin
                  memberships.
                </div>
              </div>
            </div>
          )}

          {activeTab === "subscribers" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                      <Mail size={20} className="text-[#c49b63]" />
                      Manual Newsletter
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Prepare a bulletin, then send it from your own email app
                      using BCC.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {subscribers.length} subscribers
                    </span>
                    <button
                      onClick={loadSubscribers}
                      disabled={loadingSubscribers}
                      className="p-2 text-slate-400 hover:text-[#002147] hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200 disabled:opacity-50"
                      aria-label="Refresh subscribers"
                    >
                      <Database
                        size={16}
                        className={loadingSubscribers ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label
                      htmlFor="newsletter-subject"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                    >
                      Subject
                    </label>
                    <input
                      id="newsletter-subject"
                      value={newsletterSubject}
                      onChange={(event) =>
                        setNewsletterSubject(event.target.value)
                      }
                      className="w-full rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-[#002147] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newsletter-body"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="newsletter-body"
                      value={newsletterBody}
                      onChange={(event) =>
                        setNewsletterBody(event.target.value)
                      }
                      rows={10}
                      className="w-full rounded border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 focus:border-[#002147] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newsletter-bcc"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2"
                    >
                      BCC recipients
                    </label>
                    <textarea
                      id="newsletter-bcc"
                      value={subscriberList}
                      readOnly
                      rows={3}
                      className="w-full rounded border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={composeNewsletter}
                      disabled={subscribers.length === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-[#c49b63] text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-[#b08b58] transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <Send size={14} />
                      Compose email
                    </button>
                    <button
                      onClick={() =>
                        copyNewsletterText("BCC recipients", subscriberList)
                      }
                      disabled={subscribers.length === 0}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider hover:border-[#002147] hover:text-[#002147] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Copy size={14} />
                      Copy BCC
                    </button>
                    <button
                      onClick={() =>
                        copyNewsletterText(
                          "Newsletter draft",
                          `Subject: ${newsletterSubject}\n\n${newsletterBody}`,
                        )
                      }
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded text-xs font-bold uppercase tracking-wider hover:border-[#002147] hover:text-[#002147] transition-colors"
                    >
                      <Copy size={14} />
                      Copy draft
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-base font-bold text-[#002147]">
                    Subscribers
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  {loadingSubscribers ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-[#002147] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-slate-500 text-sm">
                        Loading subscribers...
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Email Address</th>
                          <th className="px-6 py-4">Subscription Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {subscribers.map((sub) => (
                          <tr
                            key={sub.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {sub.email}
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(sub.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {subscribers.length === 0 && (
                          <tr>
                            <td
                              colSpan={2}
                              className="px-6 py-12 text-center text-slate-500 italic"
                            >
                              No one has subscribed yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <SystemStatusPanel />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <Toast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
