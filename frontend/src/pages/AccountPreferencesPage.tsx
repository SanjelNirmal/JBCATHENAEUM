import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAcademicCatalog, type AcademicSubjectOption } from "../lib/supabase/academic";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { AccountNav } from "../components/AccountNav";
import { ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { useNotificationPreferences } from "../features/engagement/hooks";
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "../lib/supabase/notificationPreferences";
import { toSafeErrorMessage } from "../lib/supabase/errors";
import { NotificationSettings } from "../components/notifications/NotificationSettings";

const preferenceRows: Array<{
  key: "inAppEnabled" | "emailEnabled" | "pushEnabled" | "submissionUpdates" | "resourceUpdates" | "moderationUpdates" | "systemAnnouncements" | "newResources" | "pastQuestions" | "accountSecurity";
  label: string;
  description: string;
}> = [
  {
    key: "inAppEnabled",
    label: "In-app notifications",
    description: "Show updates inside JBC Athenaeum.",
  },
  {
    key: "emailEnabled",
    label: "Email notifications",
    description:
      "Allow non-critical academic updates by email when email delivery is configured.",
  },
  {
    key: "pushEnabled",
    label: "Push notifications",
    description:
      "Prepare this account for future mobile push delivery. Push delivery is not active yet.",
  },
  {
    key: "submissionUpdates",
    label: "Submission updates",
    description: "Review and publication changes for your contributions.",
  },
  {
    key: "resourceUpdates",
    label: "Resource updates",
    description: "Important changes to saved or accessed resources.",
  },
  {
    key: "moderationUpdates",
    label: "Moderation updates",
    description: "Review assignments and moderation outcomes when applicable.",
  },
  {
    key: "systemAnnouncements",
    label: "System announcements",
    description:
      "Service and campus archive announcements. Security-critical notices may still be delivered.",
  },
  { key: "newResources", label: "New resources", description: "Resources published for your selected academic subjects." },
  { key: "pastQuestions", label: "Past questions", description: "New past-paper and exam-preparation resources." },
  { key: "accountSecurity", label: "Account security", description: "Important security and account alerts." },
];

export default function AccountPreferencesPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const query = useNotificationPreferences(auth.user?.id);
  const [form, setForm] = useState(defaultNotificationPreferences);
  const [message, setMessage] = useState("");
  const [catalog, setCatalog] = useState<AcademicSubjectOption[]>([]);
  useEffect(() => { void fetchAcademicCatalog().then(setCatalog).catch(() => setCatalog([])); }, []);
  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);
  if (auth.loading) return <LoadingState label="Loading preferences" />;
  if (!auth.user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  const save = async (next = form) => {
    setMessage("");
    try {
      const saved = await query.save(next);
      setForm(saved);
      setMessage("Notification preferences saved.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6"
    >
      <Seo
        title="Notification preferences"
        description="Choose your JBC Athenaeum notification preferences."
        path="/account/preferences"
        noIndex
      />
      <AccountNav />
      <div className="flex items-center gap-3">
        <Settings className="text-[#85591f]" aria-hidden="true" />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Notification preferences
        </h1>
      </div>
      <p className="mt-2 text-slate-600">
        Choose which optional academic updates you want to receive.
      </p>
      {query.isLoading ? (
        <LoadingState label="Loading preferences" />
      ) : query.isError ? (
        <div className="mt-8">
          <ErrorState
            message="Preferences could not be loaded."
            retry={() => void query.refetch()}
          />
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="mt-8 rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          <div className="divide-y divide-slate-100">
            {preferenceRows.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start justify-between gap-5 py-5"
              >
                <span>
                  <span className="block font-bold text-[#002147]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {item.description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [item.key]: event.target.checked,
                    }))
                  }
                  className="mt-1 h-5 w-5 shrink-0"
                />
              </label>
            ))}
          </div>
          <fieldset className="mt-6 border-t border-slate-200 pt-6">
            <legend className="font-bold text-[#002147]">Academic interests</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Program<select value={form.programId || ""} onChange={(event) => setForm((current) => ({ ...current, programId: event.target.value || null, termId: null, subjectIds: [] }))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="">All programs</option>{Array.from(new Map(catalog.map((item) => [item.programId, item.programName]))).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
              <label className="text-sm font-semibold">Semester / term<select value={form.termId || ""} onChange={(event) => setForm((current) => ({ ...current, termId: event.target.value || null, subjectIds: [] }))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"><option value="">All terms</option>{Array.from(new Map(catalog.filter((item) => !form.programId || item.programId === form.programId).map((item) => [item.termId, item.termName]))).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
            </div>
            <div className="mt-4"><p className="text-sm font-semibold">Subjects</p><div className="mt-2 grid max-h-52 gap-2 overflow-auto rounded-lg border border-slate-200 p-3 sm:grid-cols-2">{catalog.filter((item) => (!form.programId || item.programId === form.programId) && (!form.termId || item.termId === form.termId)).map((item) => <label key={item.subjectId} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.subjectIds.includes(item.subjectId)} onChange={(event) => setForm((current) => ({ ...current, subjectIds: event.target.checked ? [...new Set([...current.subjectIds, item.subjectId])] : current.subjectIds.filter((id) => id !== item.subjectId) }))} />{item.subjectCode ? `${item.subjectCode} — ` : ""}{item.subjectName}</label>)}</div></div>
          </fieldset>
          <fieldset className="mt-6 border-t border-slate-200 pt-6"><legend className="font-bold text-[#002147]">Quiet hours</legend><label className="mt-4 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.quietHoursEnabled} onChange={(event) => setForm((current) => ({ ...current, quietHoursEnabled: event.target.checked }))} />Pause ordinary alerts during quiet hours</label>{form.quietHoursEnabled && <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">Start<input type="time" value={form.quietHoursStart || "22:00"} onChange={(event) => setForm((current) => ({ ...current, quietHoursStart: event.target.value }))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label><label className="text-sm">End<input type="time" value={form.quietHoursEnd || "07:00"} onChange={(event) => setForm((current) => ({ ...current, quietHoursEnd: event.target.value }))} className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label></div>}</fieldset>
          {message && (
            <p
              role="status"
              className="mt-5 rounded-lg bg-slate-100 p-3 text-sm"
            >
              {message}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={query.mutation.isPending}
              className="min-h-11 rounded-lg bg-[#002147] px-5 font-bold text-white disabled:opacity-50"
            >
              {query.mutation.isPending ? "Saving…" : "Save preferences"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(defaultNotificationPreferences);
                void save(defaultNotificationPreferences);
              }}
              className="min-h-11 rounded-lg border border-slate-300 px-5 font-bold"
            >
              Reset defaults
            </button>
          </div>
        </form>
      )}
      <div className="mt-6">
        <NotificationSettings onEnabledChange={(enabled) => setForm((current) => ({ ...current, pushEnabled: enabled }))} />
      </div>
    </main>
  );
}
