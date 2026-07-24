import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import {
  type ContributorPeriod,
  fetchContributorLeaderboard,
} from "../lib/supabase/contributors";

export default function ContributorsLeaderboardPage() {
  const [period, setPeriod] = useState<ContributorPeriod>("month");
  const query = useQuery({
    queryKey: ["contributors", "leaderboard", period],
    queryFn: () => fetchContributorLeaderboard(period),
  });

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-5 py-12">
      <Seo
        title="Contributor leaderboard"
        description="Top public contributors ranked by approved contributions, downloads, and helpful ratings."
        path="/contributors"
      />
      <h1 className="font-serif text-4xl font-bold text-[#002147]">
        Contributor leaderboard
      </h1>
      <div className="mt-4 flex gap-2">
        {[
          ["month", "This month"],
          ["semester", "This semester"],
          ["all_time", "All time"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setPeriod(value as ContributorPeriod)}
            className={`min-h-11 rounded-lg px-4 text-sm font-bold ${period === value ? "bg-[#002147] text-white" : "border border-slate-300 bg-white text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Public profiles only. Email addresses and private account data are never
        shown.
      </p>
      <section className="mt-8">
        {query.isLoading ? (
          <LoadingState label="Loading leaderboard" />
        ) : query.isError ? (
          <ErrorState
            message="Leaderboard data could not be loaded."
            retry={() => void query.refetch()}
          />
        ) : !query.data?.length ? (
          <EmptyState
            title="No public contributors yet"
            message="Approved contribution stats will appear once profiles are available."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Rank",
                    "Contributor",
                    "Program/Faculty",
                    "Approved",
                    "Downloads",
                    "Helpful ratings",
                    "Verified",
                  ].map((label) => (
                    <th key={label} className="p-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.map((item, index) => (
                  <tr key={item.userId} className="border-t border-slate-100">
                    <td className="p-3 font-bold text-[#002147]">{index + 1}</td>
                    <td className="p-3">{item.contributorName}</td>
                    <td className="p-3">{item.faculty ?? "Unspecified"}</td>
                    <td className="p-3">
                      {item.approvedContributions.toLocaleString()}
                    </td>
                    <td className="p-3">{item.totalDownloads.toLocaleString()}</td>
                    <td className="p-3">{item.helpfulRatings.toLocaleString()}</td>
                    <td className="p-3">
                      {item.verifiedContributor ? "Verified" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
