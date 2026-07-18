import { Settings } from "lucide-react";
import { useEffect, useState } from "react";
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

const preferenceRows: Array<{
  key: keyof NotificationPreferences;
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
];

export default function AccountPreferencesPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const query = useNotificationPreferences(auth.user?.id);
  const [form, setForm] = useState(defaultNotificationPreferences);
  const [message, setMessage] = useState("");
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
    </main>
  );
}
