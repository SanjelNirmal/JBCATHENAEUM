import type {
  DeviceRegistration,
  DevicePlatform,
} from "../lib/supabase/devices";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface ShareInput {
  title: string;
  text?: string;
  url: string;
}

export interface ShareAdapter {
  canShare(): boolean;
  share(input: ShareInput): Promise<"shared" | "copied">;
}

export interface ExternalNavigationReservation {
  navigate(url: string): void;
}

export interface NavigationAdapter {
  openExternal(url: string): Promise<void>;
  reserveExternal(): ExternalNavigationReservation | null;
  navigateToResource(slug: string): void;
}

export interface DownloadInput {
  url: string;
  filename?: string;
}

export interface DownloadResult {
  started: boolean;
}

export interface DownloadAdapter {
  download(input: DownloadInput): Promise<DownloadResult>;
}

export interface DeviceAdapter {
  platform(): DevicePlatform;
  register(deviceName?: string): Promise<DeviceRegistration | null>;
}
