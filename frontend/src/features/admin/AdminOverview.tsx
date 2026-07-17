import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileWarning,
  Users,
} from "lucide-react";
import { ErrorState, LoadingState } from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import { fetchAdminMetrics } from "../../lib/supabase/analytics";

export default function AdminOverview() {
  const query = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: fetchAdminMetrics,
    refetchInterval: 60_000,
  });
  const values = query.data;
  const cards = [
    ["Published", values?.publishedResources, CheckCircle2],
    ["Pending reviews", values?.pendingReviews, Clock3],
    ["Changes requested", values?.changesRequested, FileWarning],
    ["Rejected", values?.rejectedSubmissions, AlertTriangle],
    ["New users this month", values?.newUsersThisMonth, Users],
    ["Downloads this month", values?.downloadsThisMonth, Download],
    ["Flagged resources", values?.flaggedResources, AlertTriangle],
    ["Failed uploads", values?.failedUploads, FileWarning],
    ["Missing metadata", values?.missingMetadata, Database],
    ["Pending storage cleanup", values?.pendingStorageCleanup, FileWarning],
    ["Managed storage", formatBytes(values?.storageBytes ?? 0), Database],
  ] as const;
  return (
    <main id="main-content">
      <Seo
        title="Admin overview"
        description="Operational platform metrics."
        path="/admin"
        noIndex
      />
      <h1 className="font-serif text-3xl font-bold text-[#002147]">
        Operations overview
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Live database aggregates, refreshed every minute.
      </p>
      <div className="mt-7">
        {query.isLoading ? (
          <LoadingState label="Loading operational metrics" />
        ) : query.isError ? (
          <ErrorState
            message="Metrics could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map(([label, value, Icon]) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <Icon className="text-[#85591f]" size={20} />
                <p className="mt-3 text-2xl font-black text-[#002147]">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                <p className="mt-1 text-sm text-slate-600">{label}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  return bytes >= 1_073_741_824
    ? `${(bytes / 1_073_741_824).toFixed(2)} GB`
    : `${(bytes / 1_048_576).toFixed(1)} MB`;
}
