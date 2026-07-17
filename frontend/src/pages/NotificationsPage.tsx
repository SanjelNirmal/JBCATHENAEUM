import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import {
  fetchNotifications,
  markNotificationRead,
} from "../lib/supabase/notifications";
import { toSafeErrorMessage } from "../lib/supabase/errors";
import { useState } from "react";

export default function NotificationsPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["notifications", auth.user?.id],
    queryFn: fetchNotifications,
    enabled: Boolean(auth.user),
  });

  if (!auth.loading && !auth.user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  const markRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      await client.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl px-5 py-16">
      <Seo
        title="Notifications"
        description="Review private submission and moderation updates."
        path="/notifications"
        noIndex
      />
      <div className="flex items-center gap-3">
        <Bell aria-hidden="true" className="text-[#85591f]" />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Notifications
        </h1>
      </div>
      <p className="mt-2 text-slate-600">
        Submission decisions and account updates appear here.
      </p>
      {message && (
        <p
          role="status"
          className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {message}
        </p>
      )}
      <div className="mt-8">
        {query.isLoading ? (
          <LoadingState label="Loading notifications" />
        ) : query.isError ? (
          <ErrorState
            message="Notifications could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : query.data?.length === 0 ? (
          <EmptyState
            title="No notifications"
            message="New submission and moderation updates will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {query.data?.map((item) => (
              <li
                key={item.id}
                className={`rounded-xl border p-5 ${item.readAt ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-[#002147]">{item.title}</h2>
                    <p className="mt-2 text-sm text-slate-700">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!item.readAt && (
                    <button
                      onClick={() => void markRead(item.id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 text-sm font-bold text-blue-900"
                    >
                      <Check size={16} aria-hidden="true" /> Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
