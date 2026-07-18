import { supabase } from "./client";
import { requireCurrentUserId } from "./currentUser";

export interface RatingSummary {
  averageRating: number;
  ratingCount: number;
}

export interface UserResourceRating {
  id: string;
  rating: number;
  reviewText: string | null;
  moderationStatus: "visible" | "pending" | "hidden";
  updatedAt: string;
}

export async function fetchRatingSummary(
  resourceId: string,
): Promise<RatingSummary> {
  const { data, error } = await supabase.rpc("get_resource_rating_summary", {
    target_resource_id: resourceId,
  });
  if (error) throw error;
  const row = data?.[0];
  return {
    averageRating: Number(row?.average_rating ?? 0),
    ratingCount: Number(row?.rating_count ?? 0),
  };
}

export async function fetchOwnRating(
  resourceId: string,
): Promise<UserResourceRating | null> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("resource_ratings")
    .select("id,rating,review_text,moderation_status,updated_at")
    .eq("user_id", userId)
    .eq("resource_id", resourceId)
    .maybeSingle();
  if (error) throw error;
  return data
    ? {
        id: data.id,
        rating: data.rating,
        reviewText: data.review_text,
        moderationStatus: data.moderation_status,
        updatedAt: data.updated_at,
      }
    : null;
}

export async function saveRating(
  resourceId: string,
  rating: number,
  reviewText: string,
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new Error("invalid_rating");
  const userId = await requireCurrentUserId();
  const value = { rating, review_text: reviewText.trim() || null };
  const { error } = await supabase.from("resource_ratings").insert({
    user_id: userId,
    resource_id: resourceId,
    ...value,
  });
  if (!error) return;
  if (error.code !== "23505") throw error;
  const { error: updateError } = await supabase
    .from("resource_ratings")
    .update(value)
    .eq("user_id", userId)
    .eq("resource_id", resourceId);
  if (updateError) throw updateError;
}

export async function deleteRating(resourceId: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("resource_ratings")
    .delete()
    .eq("user_id", userId)
    .eq("resource_id", resourceId);
  if (error) throw error;
}
