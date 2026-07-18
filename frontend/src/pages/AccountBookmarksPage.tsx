import { Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { AccountNav } from "../components/AccountNav";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { useBookmarks } from "../features/engagement/hooks";
import { toSafeErrorMessage } from "../lib/supabase/errors";

export default function AccountBookmarksPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const query = useBookmarks(auth.user?.id, page);
  if (auth.loading) return <LoadingState label="Loading bookmarks" />;
  if (!auth.user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  const pageCount = Math.max(1, Math.ceil((query.data?.total ?? 0) / 12));
  const remove = async (resourceId: string) => {
    setMessage("");
    try {
      await query.remove.mutateAsync(resourceId);
      setMessage("Bookmark removed.");
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    }
  };
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"
    >
      <Seo
        title="Saved resources"
        description="Your saved JBC Athenaeum resources."
        path="/account/bookmarks"
        noIndex
      />
      <AccountNav />
      <div className="flex items-center gap-3">
        <Bookmark className="text-[#85591f]" aria-hidden="true" />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Saved resources
        </h1>
      </div>
      <p className="mt-2 text-slate-600">
        Resources you bookmark appear here for quick access.
      </p>
      {message && (
        <p role="status" className="mt-5 rounded-lg bg-slate-100 p-3 text-sm">
          {message}
        </p>
      )}
      <div className="mt-8">
        {query.isLoading ? (
          <LoadingState label="Loading bookmarks" />
        ) : query.isError ? (
          <ErrorState
            message="Bookmarks could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : query.data?.items.length === 0 ? (
          <EmptyState
            title="No saved resources"
            message="Use the bookmark control on a resource page to save it here."
            action={
              <Link
                to="/resources"
                className="font-bold text-[#002147] underline"
              >
                Browse resources
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data?.items.map((item) => (
              <article
                key={item.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
                  {item.resourceType}
                </p>
                <h2 className="mt-2 font-serif text-xl font-bold text-[#002147]">
                  <Link to={`/resources/${item.slug}`}>{item.title}</Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {item.description || "Academic resource"}
                </p>
                <p className="mt-4 text-xs text-slate-500">
                  Saved {new Date(item.savedAt).toLocaleDateString()}
                </p>
                <button
                  type="button"
                  disabled={query.remove.isPending}
                  onClick={() => void remove(item.resourceId)}
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 text-sm font-bold text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={16} aria-hidden="true" /> Remove
                </button>
              </article>
            ))}
          </div>
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
