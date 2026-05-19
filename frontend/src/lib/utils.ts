// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "./api";

const PROFILE_INSERT_BLOCKED_CODES = new Set(["42501", "42P01", "PGRST116"]);

type ProfileDbError = { code?: string; message?: string };

export function isProfileWriteBlocked(error: unknown): boolean {
  const candidate: ProfileDbError =
    typeof error === "object" && error !== null ? (error as ProfileDbError) : {};
  const message = String(candidate.message || "").toLowerCase();
  return (
    PROFILE_INSERT_BLOCKED_CODES.has(String(candidate.code || "")) ||
    message.includes("row-level security") ||
    message.includes('relation "profiles" does not exist') ||
    message.includes("permission denied")
  );
}

export function getUserMetaString(
  user: Pick<User, "email" | "user_metadata">,
  key: "name" | "faculty",
  fallback: string
): string {
  const rawValue = user.user_metadata?.[key];
  if (typeof rawValue === "string" && rawValue.trim().length > 0) {
    return rawValue.trim();
  }
  if (key === "name") {
    const emailPrefix = user.email?.split("@")[0]?.trim();
    return emailPrefix || fallback;
  }
  return fallback;
}

export function createFallbackProfile(
  user: Pick<User, "id" | "email" | "user_metadata">
): UserProfile {
  return {
    id: user.id,
    name: getUserMetaString(user as User, "name", "Scholar"),
    faculty: getUserMetaString(user as User, "faculty", "Unknown"),
    role: "scholar",
    created_at: new Date().toISOString(),
  };
}
