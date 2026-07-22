import { platformRuntime } from "../../platform";
import { enableNativePushNotifications, initializeNativePush, disableNativePushNotifications } from "./nativePush";
import { enableWebPushNotifications, disableWebPushNotifications, getCurrentNotificationPermission, isWebPushSupported } from "./webPush";
import { currentPushDevice, lastPushRegistration } from "./subscriptions";

export async function initializePushNotifications() {
  if (platformRuntime.isNative()) await initializeNativePush();
}
export async function enablePushNotifications() {
  return platformRuntime.isNative() ? enableNativePushNotifications() : enableWebPushNotifications();
}
export async function disablePushNotifications() {
  return platformRuntime.isNative() ? disableNativePushNotifications() : disableWebPushNotifications();
}
export async function getPushNotificationState() {
  const web = !platformRuntime.isNative();
  const lastRegisteredAt = await lastPushRegistration().catch(() => null);
  const device = await currentPushDevice().catch(() => null);
  const serviceWorkerStatus = web && "serviceWorker" in navigator
    ? (await navigator.serviceWorker.getRegistration())?.active
      ? "Active"
      : "Not active"
    : platformRuntime.isNative()
      ? "Native runtime"
      : "Unsupported";
  return {
    platform: platformRuntime.getPlatform(),
    supported: platformRuntime.isNative() || await isWebPushSupported(),
    permission: platformRuntime.isNative() ? (await import("@capacitor/push-notifications")).PushNotifications.checkPermissions().then((v) => v.receive) : getCurrentNotificationPermission(),
    lastRegisteredAt,
    serviceWorkerStatus,
    fcmRegistrationStatus: lastRegisteredAt ? "Registered" : "Not registered",
    currentDeviceEnabled: device?.enabled ?? false,
    currentSubscriptionId: device?.id ?? null,
  };
}
