import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, History, RotateCcw, Shield, UserRoundX } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { AccessibleModal } from "../../components/AccessibleModal";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import { APP_ROLES, type AppRole } from "../../lib/roles";
import type { AccountStatus } from "../../lib/supabase/database.types";
import {
  fetchUsersPage,
  fetchUserActivity,
  setAccountStatus,
  updateSafeUserProfile,
  updateUserRole,
  type AdminUser,
} from "../../lib/supabase/profiles";
import { toSafeErrorMessage } from "../../lib/supabase/errors";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

export default function UserManagementPage() {
  const auth = useCurrentAuth();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [role, setRole] = useState<AppRole | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<AdminUser | null>(null);
  const [activityUser, setActivityUser] = useState<AdminUser | null>(null);
  const [dialog, setDialog] = useState<{
    user: AdminUser;
    status: AccountStatus;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const query = useQuery({
    queryKey: ["admin-users", page, debouncedSearch, role, status],
    queryFn: () =>
      fetchUsersPage(
        page,
        20,
        debouncedSearch,
        role || undefined,
        status || undefined,
      ),
  });
  const activityQuery = useQuery({
    queryKey: ["admin-user-activity", activityUser?.id],
    queryFn: () => fetchUserActivity(activityUser!.id),
    enabled: Boolean(activityUser),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const changeRole = async (user: AdminUser, selectedRole: AppRole) => {
    setBusy(true);
    try {
      const granted = !user.roles.includes(selectedRole);
      await updateUserRole(user.id, selectedRole, granted);
      setMessage(
        `${selectedRole} role ${granted ? "granted" : "revoked"} for ${user.name}.`,
      );
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const changeStatus = async (reason: string) => {
    if (!dialog) return;
    setBusy(true);
    try {
      await setAccountStatus(dialog.user.id, dialog.status, reason);
      setMessage(`${dialog.user.name} is now ${dialog.status}.`);
      setDialog(null);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await updateSafeUserProfile(
        editor.id,
        String(form.get("name")),
        String(form.get("faculty")),
        String(form.get("avatarUrl")),
        String(form.get("bio")),
      );
      setMessage(`Safe profile fields updated for ${editor.name}.`);
      setEditor(null);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const users = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <main id="main-content">
      <Seo
        title="User management"
        description="Manage account status and role memberships."
        path="/admin/users"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        User management
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Profile records are not authentication accounts. Suspension is a
        separate audited status.
      </p>
      <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <label className="text-sm font-semibold">
          Search name or user ID
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Role
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as AppRole | "");
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All roles</option>
            {APP_ROLES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Account status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AccountStatus | "");
              setPage(1);
            }}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      <p className="mt-4 text-sm font-semibold text-slate-600">
        {total.toLocaleString()} matching users · page {page} of {pages}
      </p>
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading users" />
        ) : query.isError ? (
          <ErrorState
            message="Users could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : users.length === 0 ? (
          <EmptyState
            title="No matching users"
            message="Change the search or filters."
          />
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-[#002147]">{user.name}</h2>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {user.id}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {user.faculty} · {user.submissionCount} submissions ·{" "}
                      {user.moderationCount} reviews
                    </p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-bold uppercase">
                    {user.account_status}
                  </span>
                </div>
                <div
                  className="mt-4 flex flex-wrap gap-2"
                  aria-label={`Roles for ${user.name}`}
                >
                  {APP_ROLES.map((value) => {
                    const active = user.roles.includes(value);
                    const privileged =
                      value === "admin" || value === "super_admin";
                    const allowed =
                      !privileged || auth.profile?.role === "super_admin";
                    return (
                      <button
                        key={value}
                        disabled={
                          busy ||
                          !allowed ||
                          (user.id === auth.user?.id && privileged)
                        }
                        onClick={() => void changeRole(user, value)}
                        aria-pressed={active}
                        className={`min-h-10 rounded-lg border px-3 text-xs font-bold disabled:opacity-40 ${active ? "border-[#002147] bg-[#002147] text-white" : "border-slate-300"}`}
                      >
                        {value.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditor(user)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold"
                  >
                    <Edit3 size={16} />
                    Edit safe profile fields
                  </button>
                  <button
                    onClick={() => setActivityUser(user)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold"
                  >
                    <History size={16} />
                    View activity history
                  </button>
                </div>
                {user.id !== auth.user?.id && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.account_status === "active" ? (
                      <button
                        onClick={() => setDialog({ user, status: "suspended" })}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-300 px-4 text-sm font-bold text-red-700"
                      >
                        <UserRoundX size={16} />
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => setDialog({ user, status: "active" })}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-300 px-4 text-sm font-bold text-emerald-700"
                      >
                        <RotateCcw size={16} />
                        Restore
                      </button>
                    )}
                    <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <Shield size={15} />
                      Role and status changes require MFA and are audited.
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
      <nav
        aria-label="User pagination"
        className="mt-6 flex justify-center gap-3"
      >
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={page >= pages}
          onClick={() => setPage((value) => value + 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Next
        </button>
      </nav>
      {editor && (
        <AccessibleModal
          labelledBy="profile-editor-title"
          onClose={() => {
            if (!busy) setEditor(null);
          }}
          closeOnBackdrop={!busy}
        >
          <form onSubmit={saveProfile} className="space-y-4">
            <h2
              id="profile-editor-title"
              className="font-serif text-2xl font-bold text-[#002147]"
            >
              Edit safe profile fields
            </h2>
            <p className="text-sm text-slate-600">
              Role, account status, verification, and audit fields are not
              editable here.
            </p>
            <label className="block text-sm font-semibold">
              Full name
              <input
                name="name"
                defaultValue={editor.name}
                required
                minLength={2}
                maxLength={120}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Faculty or program
              <input
                name="faculty"
                defaultValue={editor.faculty}
                required
                minLength={2}
                maxLength={160}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Avatar HTTPS URL
              <input
                name="avatarUrl"
                type="url"
                defaultValue={editor.avatar_url ?? ""}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Public biography
              <textarea
                name="bio"
                defaultValue={editor.bio ?? ""}
                maxLength={2000}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white disabled:opacity-40"
              >
                Save profile
              </button>
            </div>
          </form>
        </AccessibleModal>
      )}
      {activityUser && (
        <AccessibleModal
          label={`Activity history for ${activityUser.name}`}
          onClose={() => setActivityUser(null)}
          className="max-w-3xl"
        >
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            Activity history
          </h2>
          <p className="mt-1 text-sm text-slate-600">{activityUser.name}</p>
          <div className="mt-5">
            {activityQuery.isLoading ? (
              <LoadingState label="Loading user activity" />
            ) : activityQuery.isError ? (
              <ErrorState
                message="User activity could not be loaded."
                retry={() => void activityQuery.refetch()}
              />
            ) : !activityQuery.data?.submissions.length &&
              !activityQuery.data?.reviews.length ? (
              <EmptyState
                title="No recorded activity"
                message="This account has no visible submissions or moderation decisions."
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <ActivityList
                  title="Submission history"
                  items={(activityQuery.data?.submissions ?? []).map(
                    (item) => ({
                      id: item.id,
                      title: item.title,
                      detail: item.status,
                      occurredAt: item.occurredAt,
                    }),
                  )}
                />
                <ActivityList
                  title="Moderation history"
                  items={(activityQuery.data?.reviews ?? []).map((item) => ({
                    id: item.id,
                    title: item.title,
                    detail: item.decision,
                    occurredAt: item.occurredAt,
                  }))}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => setActivityUser(null)}
            className="mt-6 min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white"
          >
            Close
          </button>
        </AccessibleModal>
      )}
      {dialog && (
        <ConfirmDialog
          title={`${dialog.status === "active" ? "Restore" : "Suspend"} ${dialog.user.name}`}
          description={
            dialog.status === "active"
              ? "This restores access according to the user's role memberships."
              : "Suspension blocks privileged actions and application access but does not delete the authentication account."
          }
          confirmLabel={
            dialog.status === "active" ? "Restore account" : "Suspend account"
          }
          destructive={dialog.status !== "active"}
          requireReason={dialog.status !== "active"}
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => void changeStatus(reason)}
        />
      )}
    </main>
  );
}

function ActivityList({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    detail: string;
    occurredAt: string;
  }>;
}) {
  return (
    <section>
      <h3 className="font-bold text-[#002147]">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-200 p-3"
            >
              <strong className="block text-sm">{item.title}</strong>
              <span className="mt-1 block text-xs text-slate-600">
                {item.detail.replace("_", " ")} ·{" "}
                {new Date(item.occurredAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No entries.</p>
      )}
    </section>
  );
}
