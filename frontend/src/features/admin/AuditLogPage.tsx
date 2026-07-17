import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import { fetchAuditEvents } from "../../lib/supabase/analytics";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["audit-events", page],
    queryFn: () => fetchAuditEvents(page, 20),
  });
  return (
    <main id="main-content">
      <Seo
        title="Audit logs"
        description="Review append-only administrative events."
        path="/admin/audit-logs"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        Audit logs
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Security-sensitive events are append-only and ordered newest first.
      </p>
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading audit events" />
        ) : query.isError ? (
          <ErrorState
            message="Audit logs could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : query.data?.items.length === 0 ? (
          <EmptyState
            title="No audit events"
            message="Events appear after administrative actions."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[50rem] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Time", "Action", "Entity", "Actor", "Metadata"].map(
                    (heading) => (
                      <th key={heading} scope="col" className="p-3">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="p-3">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold">{item.action}</td>
                    <td className="p-3">
                      {item.entityType}
                      <br />
                      <span className="text-xs text-slate-500">
                        {item.entityId ?? "—"}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{item.actorId ?? "System"}</td>
                    <td className="max-w-xs p-3">
                      <code
                        className="block truncate text-xs"
                        title={JSON.stringify(item.metadata)}
                      >
                        {JSON.stringify(item.metadata)}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={(query.data?.items.length ?? 0) < 20}
          onClick={() => setPage((value) => value + 1)}
          className="min-h-11 rounded-lg border border-slate-300 px-5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </main>
  );
}
