import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentAuth } from "../app/AuthContext";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import {
  createResourceRequest,
  listPublicResourceRequests,
  supportResourceRequest,
} from "../lib/supabase/resourceRequests";

export default function ResourceRequestsPage() {
  const auth = useCurrentAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["resource-requests", "public"],
    queryFn: listPublicResourceRequests,
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth.user) {
      setMessage("Please sign in to request a resource.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await createResourceRequest({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
      });
      setMessage("Your request has been submitted.");
      event.currentTarget.reset();
      await queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
    } catch {
      setMessage("This request could not be submitted.");
    } finally {
      setBusy(false);
    }
  };

  const support = async (id: string) => {
    if (!auth.user) {
      setMessage("Please sign in to support requests.");
      return;
    }
    setBusy(true);
    try {
      await supportResourceRequest(id);
      setMessage("Request supported.");
      await queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
    } catch {
      setMessage("Support could not be recorded.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-5 py-12">
      <Seo
        title="Resource requests"
        description="Request missing TU notes and resources, or support existing requests."
        path="/resource-requests"
      />
      <h1 className="font-serif text-4xl font-bold text-[#002147]">
        We do not have this resource yet.
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
        Request missing notes and support requests from other students so
        contributors and moderators can prioritize them.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          {query.isLoading ? (
            <LoadingState label="Loading requests" />
          ) : query.isError ? (
            <ErrorState
              message="Requests could not be loaded."
              retry={() => void query.refetch()}
            />
          ) : !query.data?.length ? (
            <EmptyState
              title="No open requests yet"
              message="Be the first student to request a reviewed resource."
            />
          ) : (
            <div className="space-y-4">
              {query.data.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-bold text-[#002147]">{item.title}</h2>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                        {item.status}
                      </p>
                    </div>
                    <button
                      onClick={() => void support(item.id)}
                      disabled={busy}
                      className="min-h-11 rounded-lg border border-[#002147] px-4 text-sm font-bold text-[#002147]"
                    >
                      Support ({item.requestCount})
                    </button>
                  </div>
                  {item.description && (
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {item.description}
                    </p>
                  )}
                  {item.fulfilledResourceId && (
                    <Link
                      to={`/resources/${item.fulfilledResourceId}`}
                      className="mt-3 inline-flex text-sm font-bold text-[#002147] underline"
                    >
                      Open fulfilled resource
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            Request this resource
          </h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold">
              Resource title
              <input
                name="title"
                required
                minLength={5}
                maxLength={240}
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
            <label className="block text-sm font-semibold">
              Description
              <textarea
                name="description"
                rows={4}
                maxLength={2000}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3"
              />
            </label>
            <button
              disabled={busy}
              className="min-h-11 w-full rounded-lg bg-[#002147] font-bold text-white"
            >
              Submit request
            </button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            <Link to="/contribute" className="font-bold text-[#002147] underline">
              Contribute the first resource
            </Link>{" "}
            or help classmates by uploading an approved file.
          </p>
          {message && (
            <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
              {message}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
