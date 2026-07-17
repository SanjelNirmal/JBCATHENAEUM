import { useQuery } from "@tanstack/react-query";
import { FileUp } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { fetchContributorSubmissions } from "../lib/supabase/submissions";

export default function MySubmissionsPage() {
  const auth = useCurrentAuth();
  const location = useLocation();
  const query = useQuery({
    queryKey: ["my-submissions", auth.user?.id],
    queryFn: fetchContributorSubmissions,
    enabled: Boolean(auth.user),
  });
  if (!auth.loading && !auth.user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-5 py-16">
      <Seo
        title="My submissions"
        description="Track your private resource submissions."
        path="/my-submissions"
        noIndex
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-[#002147]">
            My submissions
          </h1>
          <p className="mt-2 text-slate-600">
            Track review status and respond to moderator feedback.
          </p>
        </div>
        <Link
          to="/contribute"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002147] px-5 font-bold text-white"
        >
          <FileUp size={18} />
          Upload PDF
        </Link>
      </div>
      <div className="mt-8">
        {query.isLoading ? (
          <LoadingState label="Loading submissions" />
        ) : query.isError ? (
          <ErrorState
            message="Your submissions could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : query.data?.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            message="Upload an academic PDF to begin the review process."
            action={
              <Link
                to="/contribute"
                className="font-bold text-[#002147] underline"
              >
                Upload a resource
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {query.data?.map((item) => (
              <article
                key={item.resourceId}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#002147]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Submitted{" "}
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="h-fit rounded-full border border-slate-300 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    {item.resourceStatus.replace("_", " ")}
                  </span>
                </div>
                {item.feedback && (
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                    <strong>Reviewer message:</strong> {item.feedback}
                  </div>
                )}
                {["changes_requested", "rejected"].includes(
                  item.resourceStatus,
                ) && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      to={`/contribute?resubmit=${item.resourceId}`}
                      className="inline-flex min-h-11 items-center rounded-lg bg-[#002147] px-5 font-bold text-white"
                    >
                      Edit and replace file
                    </Link>
                    <span className="self-center text-sm text-slate-500">
                      Resubmission creates a new version and preserves review
                      history.
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
