import { publicEnvironment } from "../env";
import { supabase } from "../supabase/client";
import { requireCurrentUserId } from "../supabase/currentUser";
import type { DevicePlatform } from "../supabase/devices";

export async function savePushSubscription(token: string, platform: DevicePlatform) {
  const userId = await requireCurrentUserId();
  const browser = platform === "web" ? navigator.userAgent.split(" ").slice(-1)[0]?.slice(0, 160) || "Web browser" : null;
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    token,
    platform,
    device_name: platform === "web" ? "Web browser" : `${platform.toUpperCase()} app`,
    browser_name: browser,
    app_version: publicEnvironment.config.appVersion,
    enabled: true,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "token" });
  if (error) throw error;
}

export async function disablePushSubscription(token?: string) {
  if (!token) return;
  const userId = await requireCurrentUserId();
  let query = supabase.from("push_subscriptions").update({ enabled: false }).eq("user_id", userId);
  if (token) query = query.eq("token", token);
  const { error } = await query;
  if (error) throw error;
}

export async function lastPushRegistration(): Promise<string | null> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("push_subscriptions").select("last_seen_at").eq("user_id", userId).eq("enabled", true).order("last_seen_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data?.last_seen_at ?? null;
}
