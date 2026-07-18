import { supabase } from "./client";
import { requireCurrentUserId } from "./currentUser";

export type DevicePlatform = "web" | "android" | "ios";

export interface UserDevice {
  id: string;
  deviceKey: string;
  platform: DevicePlatform;
  deviceName: string | null;
  appVersion: string | null;
  notificationsEnabled: boolean;
  lastActiveAt: string;
}

export interface DeviceRegistration {
  deviceKey: string;
  platform: DevicePlatform;
  deviceName?: string | null;
  appVersion?: string | null;
  pushToken?: string | null;
}

export async function fetchUserDevices(): Promise<UserDevice[]> {
  const { data, error } = await supabase
    .from("user_devices")
    .select(
      "id,device_key,platform,device_name,app_version,notifications_enabled,last_active_at",
    )
    .order("last_active_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    deviceKey: item.device_key,
    platform: item.platform,
    deviceName: item.device_name,
    appVersion: item.app_version,
    notificationsEnabled: item.notifications_enabled,
    lastActiveAt: item.last_active_at,
  }));
}

export async function registerUserDevice(
  input: DeviceRegistration,
): Promise<void> {
  const userId = await requireCurrentUserId();
  const value = {
    platform: input.platform,
    device_name: input.deviceName?.trim() || null,
    app_version: input.appVersion?.trim() || null,
    push_token: input.pushToken || null,
    last_active_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("user_devices").insert({
    user_id: userId,
    device_key: input.deviceKey,
    ...value,
  });
  if (!error) return;
  if (error.code !== "23505") throw error;
  const { error: updateError } = await supabase
    .from("user_devices")
    .update(value)
    .eq("user_id", userId)
    .eq("device_key", input.deviceKey);
  if (updateError) throw updateError;
}

export async function removeUserDevice(deviceId: string): Promise<void> {
  const userId = await requireCurrentUserId();
  const { error } = await supabase
    .from("user_devices")
    .delete()
    .eq("id", deviceId)
    .eq("user_id", userId);
  if (error) throw error;
}
