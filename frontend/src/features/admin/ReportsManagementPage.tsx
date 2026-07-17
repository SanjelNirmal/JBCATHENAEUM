import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import {
  fetchContentRemovalRequests,
  fetchReports,
  resolveContentRemovalRequest,
  resolveReport,
} from "../../lib/supabase/reports";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

export default function ReportsManagementPage() {
  const client = useQueryClient();
  const [params] = useSearchParams();
  const resourceFilter = params.get("resource") ?? "";
  const [tab, setTab] = useState<"reports" | "removals">("reports");
  const [dialog, setDialog] = useState<{
    id: string;
    kind: "report" | "removal";
    resolution: "resolved" | "dismissed";
  } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const reports = useQuery({
    queryKey: ["resource-reports", resourceFilter],
    queryFn: () => fetchReports(undefined, resourceFilter || undefined),
  });
  const removals = useQuery({
    queryKey: ["removal-requests"],
    queryFn: fetchContentRemovalRequests,
  });
  const confirm = async (note: string) => {
    if (!dialog) return;
    setBusy(true);
    try {
      dialog.kind === "report"
        ? await resolveReport(dialog.id, dialog.resolution, note)
        : await resolveContentRemovalRequest(
            dialog.id,
            dialog.resolution,
            note,
          );
      setMessage("Request resolved and audited.");
      setDialog(null);
      await client.invalidateQueries({
        queryKey:
          dialog.kind === "report"
            ? ["resource-reports"]
            : ["removal-requests"],
      });
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  const query = tab === "reports" ? reports : removals;
  const items = query.data ?? [];
  return (
    <main id="main-content">
      <Seo
        title="Reports and removals"
        description="Moderate resource reports and content removal requests."
        path="/admin/reports"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        Reports and removal requests
      </h1>
      <div className="mt-5 flex gap-2" role="tablist">
        <button
          role="tab"
          aria-selected={tab === "reports"}
          onClick={() => setTab("reports")}
          className={`min-h-11 rounded-lg px-4 font-bold ${tab === "reports" ? "bg-[#002147] text-white" : "border border-slate-300 bg-white"}`}
        >
          Resource reports
        </button>
        <button
          role="tab"
          aria-selected={tab === "removals"}
          onClick={() => setTab("removals")}
          className={`min-h-11 rounded-lg px-4 font-bold ${tab === "removals" ? "bg-[#002147] text-white" : "border border-slate-300 bg-white"}`}
        >
          Removal requests
        </button>
      </div>
      {resourceFilter && tab === "reports" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-blue-50 p-3 text-sm">
          <span className="break-all">
            Showing reports for resource {resourceFilter}
          </span>
          <Link
            to="/admin/reports"
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-blue-300 bg-white px-3 font-bold"
          >
            <X size={15} /> Clear resource filter
          </Link>
        </div>
      )}
      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm" role="status">
          {message}
        </p>
      )}
      <div className="mt-6">
        {query.isLoading ? (
          <LoadingState label="Loading reports" />
        ) : query.isError ? (
          <ErrorState
            message="Reports could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No reports"
            message="There are no matching moderation requests."
          />
        ) : (
          <div className="space-y-4">
            {tab === "reports"
              ? reports.data?.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[#002147]">
                          {item.reason}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.details || "No additional details."}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Resource {item.resourceId} ·{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="h-fit rounded-full border px-3 py-1 text-xs font-bold">
                        {item.status}
                      </span>
                    </div>
                    {["open", "investigating"].includes(item.status) && (
                      <Actions
                        onResolve={(resolution) =>
                          setDialog({ id: item.id, kind: "report", resolution })
                        }
                      />
                    )}
                  </article>
                ))
              : removals.data?.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-[#002147]">
                          {item.reason}
                        </h2>
                        <p className="mt-1 text-sm text-slate-700">
                          {item.details}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          {item.requesterName} · {item.requesterEmail} ·{" "}
                          {item.relationship} ·{" "}
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.resourceId && (
                          <p className="mt-1 text-xs text-slate-500">
                            Resource {item.resourceId}
                          </p>
                        )}
                        {item.evidenceUrl && (
                          <a
                            href={item.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-bold underline"
                          >
                            Evidence <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <span className="h-fit rounded-full border px-3 py-1 text-xs font-bold">
                        {item.status}
                      </span>
                    </div>
                    {["open", "investigating"].includes(item.status) && (
                      <Actions
                        onResolve={(resolution) =>
                          setDialog({
                            id: item.id,
                            kind: "removal",
                            resolution,
                          })
                        }
                      />
                    )}
                  </article>
                ))}
          </div>
        )}
      </div>
      {dialog && (
        <ConfirmDialog
          title={`${dialog.resolution === "resolved" ? "Resolve" : "Dismiss"} request`}
          description="Provide a clear internal decision note. The action is audited."
          confirmLabel={
            dialog.resolution === "resolved" ? "Resolve" : "Dismiss"
          }
          destructive={dialog.resolution === "dismissed"}
          requireReason
          busy={busy}
          onClose={() => setDialog(null)}
          onConfirm={(note) => void confirm(note)}
        />
      )}
    </main>
  );
}
function Actions({
  onResolve,
}: {
  onResolve: (resolution: "resolved" | "dismissed") => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={() => onResolve("resolved")}
        className="min-h-10 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white"
      >
        Resolve
      </button>
      <button
        onClick={() => onResolve("dismissed")}
        className="min-h-10 rounded-lg border border-red-300 px-4 text-sm font-bold text-red-700"
      >
        Dismiss
      </button>
    </div>
  );
}
