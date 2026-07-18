import type {
  DeviceAdapter,
  DownloadAdapter,
  ExternalNavigationReservation,
  NavigationAdapter,
  ShareAdapter,
  StorageAdapter,
} from "./adapters";

const WEB_DEVICE_KEY = "jbc:web-device-key";

function safeExternalUrl(value: string): URL {
  const url = new URL(value, window.location.origin);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("unsafe_external_url");
  return url;
}

export const webStorageAdapter: StorageAdapter = {
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

export const webShareAdapter: ShareAdapter = {
  canShare() {
    return typeof navigator.share === "function";
  },
  async share(input) {
    if (navigator.share && (!navigator.canShare || navigator.canShare(input))) {
      await navigator.share(input);
      return "shared";
    }
    await navigator.clipboard.writeText(input.url);
    return "copied";
  },
};

export const webNavigationAdapter: NavigationAdapter = {
  async openExternal(value) {
    const url = safeExternalUrl(value);
    const opened = window.open(
      url.toString(),
      "_blank",
      "noopener,noreferrer",
    );
    if (!opened) window.location.assign(url.toString());
  },
  reserveExternal(): ExternalNavigationReservation | null {
    const target = window.open("about:blank", "_blank");
    if (!target) return null;
    target.opener = null;
    return {
      navigate(value) {
        const url = safeExternalUrl(value);
        target.location.replace(url.toString());
      },
    };
  },
  navigateToResource(slug) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new Error("invalid_resource_slug");
    window.location.assign(`/resources/${slug}`);
  },
};

export const webDownloadAdapter: DownloadAdapter = {
  async download(input) {
    const url = safeExternalUrl(input.url);
    const anchor = document.createElement("a");
    anchor.href = url.toString();
    anchor.rel = "noopener noreferrer";
    if (input.filename) anchor.download = input.filename;
    anchor.click();
    return { started: true };
  },
};

export const webDeviceAdapter: DeviceAdapter = {
  platform() {
    const agent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(agent)) return "ios";
    if (agent.includes("android")) return "android";
    return "web";
  },
  async register(deviceName) {
    let deviceKey = await webStorageAdapter.getItem(WEB_DEVICE_KEY);
    if (!deviceKey) {
      deviceKey = crypto.randomUUID();
      await webStorageAdapter.setItem(WEB_DEVICE_KEY, deviceKey);
    }
    return {
      deviceKey,
      platform: this.platform(),
      deviceName: deviceName?.trim() || navigator.platform || "Web browser",
      appVersion: import.meta.env.VITE_APP_VERSION ?? "web",
      pushToken: null,
    };
  },
};
