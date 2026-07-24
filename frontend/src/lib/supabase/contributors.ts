import { supabase } from "./client";

export type ContributorPeriod = "month" | "semester" | "all_time";

export interface PublicContributorStat {
  userId: string;
  contributorName: string;
  faculty: string | null;
  approvedContributions: number;
  totalDownloads: number;
  helpfulRatings: number;
  averageRating: number;
  verifiedContributor: boolean;
}

export async function fetchContributorLeaderboard(
  period: ContributorPeriod,
): Promise<PublicContributorStat[]> {
  const { data, error } = await (supabase as any).rpc(
    "get_public_contributor_leaderboard",
    { target_period: period },
  );
  if (error) throw error;
  return ((data ?? []) as any[]).map((item) => ({
    userId: item.user_id,
    contributorName: item.contributor_name,
    faculty: item.faculty ?? null,
    approvedContributions: Number(item.approved_contributions ?? 0),
    totalDownloads: Number(item.total_downloads ?? 0),
    helpfulRatings: Number(item.helpful_ratings ?? 0),
    averageRating: Number(item.average_rating ?? 0),
    verifiedContributor: Boolean(item.verified_contributor),
  }));
}
