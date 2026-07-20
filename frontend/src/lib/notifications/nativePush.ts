import { PushNotifications, type PushNotificationSchema, type ActionPerformed } from "@capacitor/push-notifications";
import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { platformRuntime } from "../../platform";
import { disablePushSubscription, savePushSubscription } from "./subscriptions";
import { openNotificationRoute } from "./safety";

let handles: PluginListenerHandle[] = [];
let currentToken: string | undefined;
const FcmToken = registerPlugin<{ getToken(): Promise<{ token: string }>; addListener(event: "tokenReceived", listener: (value: { token: string }) => void): Promise<PluginListenerHandle>; }>("FcmToken");

export function isNativePushSupported() { return platformRuntime.isNative(); }

export async function initializeNativePush(onForeground?: (notification: PushNotificationSchema) => void) {
  if (!isNativePushSupported() || handles.length) return;
  if (platformRuntime.getPlatform() === "android") {
    await PushNotifications.createChannel({ id: "academic_updates", name: "Academic updates", description: "New resources, reviews, and important campus archive updates", importance: 4, visibility: 1 });
  }
  handles = await Promise.all([
    PushNotifications.addListener("registration", async ({ value }) => {
      const token = platformRuntime.getPlatform() === "ios" ? (await FcmToken.getToken()).token : value;
      currentToken = token;
      await savePushSubscription(token, platformRuntime.devicePlatform());
    }),
    PushNotifications.addListener("registrationError", ({ error }) => console.error("native_push_registration_error", { message: String(error).slice(0, 160) })),
    PushNotifications.addListener("pushNotificationReceived", (notification) => onForeground?.(notification)),
    PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => openNotificationRoute(action.notification.data?.url)),
  ]);
  if (platformRuntime.getPlatform() === "ios") {
    handles.push(await FcmToken.addListener("tokenReceived", ({ token }) => { currentToken = token; void savePushSubscription(token, "ios"); }));
  }
}

export async function enableNativePushNotifications() {
  await initializeNativePush();
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt") permission = await PushNotifications.requestPermissions();
  if (permission.receive !== "granted") throw new Error("notification_permission_denied");
  await PushNotifications.register();
}

export async function disableNativePushNotifications() {
  await disablePushSubscription(currentToken);
  await PushNotifications.unregister();
  currentToken = undefined;
}

export async function removeNativePushListeners() {
  const previous = handles;
  handles = [];
  await Promise.all(previous.map((handle) => handle.remove()));
}
