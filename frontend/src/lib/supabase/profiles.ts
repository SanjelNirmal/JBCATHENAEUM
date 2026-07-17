import type { AppRole } from "../roles";
import type { AccountStatus } from "./database.types";
import { supabase } from "./client";
import type { UserProfile } from "./auth";

export interface AdminUser extends UserProfile {
  submissionCount: number;
  moderationCount: number;
}

export interface UserActivity {
  submissions: Array<{
    id: string;
    title: string;
    status: string;
    occurredAt: string;
  }>;
  reviews: Array<{
    id: string;
    title: string;
    decision: string;
    occurredAt: string;
  }>;
}

export async function fetchUsersPage(
  page = 1,
  pageSize = 20,
  search = "",
  role?: AppRole,
  status?: AccountStatus,
): Promise<{ items: AdminUser[]; total: number }> {
  let allowedIds: string[] | null = null;
  if (role) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", role);
    if (error) throw error;
    allowedIds = (data ?? []).map((item) => item.user_id);
    if (!allowedIds.length) return { items: [], total: 0 };
  }
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("profiles")
    .select(
      "id,name,faculty,avatar_url,bio,account_status,suspended_at,created_at,updated_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (search.trim())
    query = /^[0-9a-f-]{36}$/i.test(search.trim())
      ? query.eq("id", search.trim())
      : query.ilike("name", `%${search.trim()}%`);
  if (status) query = query.eq("account_status", status);
  if (allowedIds) query = query.in("id", allowedIds);
  const { data: profiles, count, error } = await query;
  if (error) throw error;
  if (!profiles?.length) return { items: [], total: count ?? 0 };
  const ids = profiles.map((profile) => profile.id);
  const [
    { data: roleRows, error: roleError },
    { data: submissions },
    { data: reviews },
  ] = await Promise.all([
    supabase.from("user_roles").select("user_id,role").in("user_id", ids),
    supabase
      .from("resource_submissions")
      .select("submitter_id")
      .in("submitter_id", ids),
    supabase
      .from("resource_reviews")
      .select("reviewer_id")
      .in("reviewer_id", ids),
  ]);
  if (roleError) throw roleError;
  const items = profiles.flatMap((profile) => {
    const roles = (roleRows ?? [])
      .filter((row) => row.user_id === profile.id)
      .map((row) => row.role)
      .filter((value): value is AppRole => typeof value === "string");
    if (role && !roles.includes(role)) return [];
    const normalized = roles.length ? roles : ["student" as AppRole];
    return [
      {
        ...profile,
        faculty: profile.faculty ?? "Unspecified",
        account_status: profile.account_status ?? "active",
        roles: normalized,
        role: normalized.includes("super_admin")
          ? "super_admin"
          : normalized.includes("admin")
            ? "admin"
            : normalized.includes("moderator")
              ? "moderator"
              : normalized[0],
        submissionCount: (submissions ?? []).filter(
          (item) => item.submitter_id === profile.id,
        ).length,
        moderationCount: (reviews ?? []).filter(
          (item) => item.reviewer_id === profile.id,
        ).length,
      } as AdminUser,
    ];
  });
  return { items, total: count ?? items.length };
}

export async function fetchUsers(
  search = "",
  role?: AppRole,
  status?: AccountStatus,
): Promise<AdminUser[]> {
  return (await fetchUsersPage(1, 100, search, role, status)).items;
}

export async function fetchUserActivity(userId: string): Promise<UserActivity> {
  const [submissions, reviews] = await Promise.all([
    supabase
      .from("resource_submissions")
      .select("id,resource_id,status,submitted_at")
      .eq("submitter_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(50),
    supabase
      .from("resource_reviews")
      .select("id,resource_id,decision,created_at")
      .eq("reviewer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (submissions.error) throw submissions.error;
  if (reviews.error) throw reviews.error;
  const resourceIds = [
    ...new Set([
      ...(submissions.data ?? []).map((item) => item.resource_id),
      ...(reviews.data ?? []).map((item) => item.resource_id),
    ]),
  ];
  const resources = resourceIds.length
    ? await supabase.from("resources").select("id,title").in("id", resourceIds)
    : { data: [], error: null };
  if (resources.error) throw resources.error;
  const titleFor = (resourceId: string) =>
    resources.data?.find((resource) => resource.id === resourceId)?.title ??
    "Unavailable resource";
  return {
    submissions: (submissions.data ?? []).map((item) => ({
      id: item.id,
      title: titleFor(item.resource_id),
      status: item.status,
      occurredAt: item.submitted_at,
    })),
    reviews: (reviews.data ?? []).map((item) => ({
      id: item.id,
      title: titleFor(item.resource_id),
      decision: item.decision,
      occurredAt: item.created_at,
    })),
  };
}

export async function updateUserRole(
  id: string,
  role: AppRole,
  shouldGrant: boolean,
) {
  const { error } = await supabase.rpc("set_user_role", {
    target_user_id: id,
    target_role: role,
    should_grant: shouldGrant,
  });
  if (error) throw error;
}

export async function setAccountStatus(
  id: string,
  status: AccountStatus,
  reason: string,
) {
  const { error } = await supabase.rpc("set_account_status", {
    target_user_id: id,
    next_status: status,
    supplied_reason: reason,
  });
  if (error) throw error;
}

export async function updateSafeUserProfile(
  id: string,
  name: string,
  faculty: string,
  avatarUrl: string,
  bio: string,
) {
  const { error } = await supabase.rpc("update_user_profile_safe", {
    target_user_id: id,
    next_name: name,
    next_faculty: faculty,
    next_avatar_url: avatarUrl,
    next_bio: bio,
  });
  if (error) throw error;
}

export async function updateMyProfile(
  id: string,
  name: string,
  faculty: string,
  avatarUrl: string,
  bio: string,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      name: name.trim(),
      faculty: faculty.trim(),
      avatar_url: avatarUrl.trim() ? avatarUrl.trim() : null,
      bio: bio.trim() ? bio.trim() : null,
    })
    .eq("id", id);
  if (error) throw error;
}
