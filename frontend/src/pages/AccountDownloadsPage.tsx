import { Download } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { AccountNav } from "../components/AccountNav";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { useDownloadHistory } from "../features/engagement/hooks";

export default function AccountDownloadsPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const query = useDownloadHistory(auth.user?.id, page);
  if (auth.loading) return <LoadingState label="Loading download history" />;
  if (!auth.user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  const pageCount = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6"
    >
      <Seo
        title="Download history"
        description="Your authenticated resource download history."
        path="/account/downloads"
        noIndex
      />
      <AccountNav />
      <div className="flex items-center gap-3">
        <Download className="text-[#85591f]" aria-hidden="true" />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Download history
        </h1>
      </div>
      <p className="mt-2 text-slate-600">
        Downloads made while signed in appear here. Earlier anonymous downloads
        cannot be recovered.
      </p>
      <div className="mt-8">
        {query.isLoading ? (
          <LoadingState label="Loading download history" />
        ) : query.isError ? (
          <ErrorState
            message="Download history could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : query.data?.items.length === 0 ? (
          <EmptyState
            title="No signed-in downloads"
            message="Open a resource while signed in and it will appear here."
          />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {query.data?.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <Link
                    to={`/resources/${item.slug}`}
                    className="font-bold text-[#002147] underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.downloadedAt).toLocaleString()}
                    {item.versionNumber
                      ? ` · Version ${item.versionNumber}`
                      : ""}
                  </p>
                </div>
                <Link
                  to={`/resources/${item.slug}`}
                  className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-bold"
                >
                  View resource
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="min-h-11 rounded-lg border border-slate-300 px-4 font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {pageCount}
          </span>
          <button
            disabled={page >= pageCount}
            onClick={() => setPage((value) => value + 1)}
            className="min-h-11 rounded-lg border border-slate-300 px-4 font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
