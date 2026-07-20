import { platformRuntime } from "../../platform";
import { enableNativePushNotifications, initializeNativePush, disableNativePushNotifications } from "./nativePush";
import { enableWebPushNotifications, disableWebPushNotifications, getCurrentNotificationPermission, isWebPushSupported } from "./webPush";
import { lastPushRegistration } from "./subscriptions";

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
  return {
    platform: platformRuntime.getPlatform(),
    supported: platformRuntime.isNative() || await isWebPushSupported(),
    permission: platformRuntime.isNative() ? (await import("@capacitor/push-notifications")).PushNotifications.checkPermissions().then((v) => v.receive) : getCurrentNotificationPermission(),
    lastRegisteredAt: await lastPushRegistration().catch(() => null),
  };
}
