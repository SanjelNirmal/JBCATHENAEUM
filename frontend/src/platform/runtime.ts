import { Capacitor } from "@capacitor/core";
import type { DevicePlatform } from "../lib/supabase/devices";
import { publicEnvironment } from "../lib/env";

export type AppPlatform = "web" | "android" | "ios";

function normalizePlatform(value: string): AppPlatform {
  return value === "android" || value === "ios" ? value : "web";
}

/** The only application-level boundary for native platform detection. */
export const platformRuntime = {
  getPlatform(): AppPlatform {
    return normalizePlatform(Capacitor.getPlatform());
  },
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },
  devicePlatform(): DevicePlatform {
    return this.getPlatform();
  },
};

export function publicAppUrl(path = "/"): string {
  const url = new URL(path, publicEnvironment.config.publicAppUrl);
  if (url.protocol !== "https:") throw new Error("invalid_public_app_url");
  return url.toString();
}
