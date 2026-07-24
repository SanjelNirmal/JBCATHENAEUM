import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import {
  type ResourceRequestStatus,
  listAdminResourceRequests,
  updateResourceRequestStatus,
} from "../../lib/supabase/resourceRequests";

export default function AdminResourceRequestsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["resource-requests", "admin"],
    queryFn: listAdminResourceRequests,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const updateStatus = async (requestId: string, status: ResourceRequestStatus) => {
    setBusyId(requestId);
    try {
      await updateResourceRequestStatus({ requestId, status });
      setMessage("Request status updated.");
      await queryClient.invalidateQueries({ queryKey: ["resource-requests"] });
    } catch {
      setMessage("Request status update failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main id="main-content">
      <Seo
        title="Admin resource requests"
        description="Moderate student resource requests."
        path="/admin/resource-requests"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        Resource requests
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Review, prioritize, and resolve missing material requests.
      </p>
      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading requests" />
        ) : query.isError ? (
          <ErrorState
            message="Requests could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : !query.data?.length ? (
          <EmptyState
            title="No requests"
            message="Public request records will appear here."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Title", "Status", "Votes", "Actions"].map((label) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="p-3 font-semibold text-[#002147]">{item.title}</td>
                    <td className="p-3">{item.status}</td>
                    <td className="p-3">{item.request_count}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {(
                          ["open", "planned", "fulfilled", "closed", "rejected"] as const
                        ).map((status) => (
                          <button
                            key={status}
                            onClick={() => void updateStatus(item.id, status)}
                            disabled={busyId === item.id}
                            className="min-h-9 rounded border border-slate-300 px-2 text-xs font-bold"
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
