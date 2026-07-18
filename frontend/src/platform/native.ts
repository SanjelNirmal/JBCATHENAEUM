import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Share } from "@capacitor/share";
import { publicEnvironment } from "../lib/env";
import type {
  DeviceAdapter,
  DownloadAdapter,
  NavigationAdapter,
  ShareAdapter,
  StorageAdapter,
} from "./adapters";
import { platformRuntime, publicAppUrl } from "./runtime";

const INSTALLATION_KEY = "jbc:native-installation-id";
const PUBLIC_RESOURCE_PATH = /^\/resources\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_HOSTS = new Set([
  "jbc.nirmalsanjel.com.np",
  "nirmalsanjel.com.np",
  "www.nirmalsanjel.com.np",
  "drive.google.com",
  "docs.google.com",
  "facebook.com",
  "www.facebook.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "www.youtube.com",
  "linkedin.com",
  "www.linkedin.com",
  "github.com",
]);

function supabaseHost(): string | null {
  try {
    return new URL(publicEnvironment.config.supabaseUrl).hostname;
  } catch {
    return null;
  }
}

export function safeNativeExternalUrl(value: string): URL {
  const url = new URL(value);
  if (["mailto:", "tel:"].includes(url.protocol)) {
    if (url.username || url.password || url.hash)
      throw new Error("unsafe_external_url");
    return url;
  }
  const allowedSupabaseHost = supabaseHost();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (!HTTPS_HOSTS.has(url.hostname.toLowerCase()) &&
      url.hostname.toLowerCase() !== allowedSupabaseHost)
  ) {
    throw new Error("unsafe_external_url");
  }
  return url;
}

function safePublicShareUrl(value: string): URL {
  const url = new URL(value);
  const expected = new URL(publicAppUrl());
  if (
    url.protocol !== "https:" ||
    url.origin !== expected.origin ||
    !PUBLIC_RESOURCE_PATH.test(url.pathname) ||
    url.search ||
    url.hash
  ) {
    throw new Error("unsafe_share_url");
  }
  return url;
}

export const nativeStorageAdapter: StorageAdapter = {
  // This is intentionally the WebView storage layer for the first foundation.
  // It is not described as Keychain/Keystore storage; the release checklist
  // requires a reviewed secure-storage migration before commercial launch.
  async getItem(key) {
    return window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    window.localStorage.setItem(key, value);
  },
  async removeItem(key) {
    window.localStorage.removeItem(key);
  },
};

export const nativeShareAdapter: ShareAdapter = {
  canShare() {
    return true;
  },
  async share(input) {
    const url = safePublicShareUrl(input.url);
    await Share.share({
      title: input.title,
      url: url.toString(),
      ...(input.text ? { text: input.text } : {}),
    });
    return "shared";
  },
};

export const nativeNavigationAdapter: NavigationAdapter = {
  async openExternal(value) {
    const url = safeNativeExternalUrl(value);
    if (url.protocol === "mailto:" || url.protocol === "tel:") {
      window.location.assign(url.toString());
      return;
    }
    await Browser.open({ url: url.toString(), presentationStyle: "popover" });
  },
  reserveExternal() {
    // Native browser presentation is asynchronous and does not use popup
    // reservations. Callers safely fall back to openExternal().
    return null;
  },
  navigateToResource(slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new Error("invalid_resource_slug");
    window.dispatchEvent(
      new CustomEvent("jbc:navigate", { detail: `/resources/${slug}` }),
    );
  },
};

export const nativeDownloadAdapter: DownloadAdapter = {
  async download(input) {
    // First release is view-only: do not copy protected PDFs into public or
    // app-private storage without an explicit backend permission model.
    await nativeNavigationAdapter.openExternal(input.url);
    return { started: true };
  },
};

export const nativeDeviceAdapter: DeviceAdapter = {
  platform() {
    return platformRuntime.devicePlatform();
  },
  async register(deviceName) {
    let deviceKey = await nativeStorageAdapter.getItem(INSTALLATION_KEY);
    if (!deviceKey) {
      deviceKey = crypto.randomUUID();
      await nativeStorageAdapter.setItem(INSTALLATION_KEY, deviceKey);
    }
    const info = await App.getInfo();
    const platform = this.platform();
    return {
      deviceKey,
      platform,
      deviceName:
        deviceName?.trim() ||
        `JBC Athenaeum on ${platform === "ios" ? "iOS" : "Android"}`,
      appVersion: `${info.version} (${info.build})`,
      pushToken: null,
    };
  },
};
