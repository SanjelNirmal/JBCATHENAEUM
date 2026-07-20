import { deleteToken, getToken } from "firebase/messaging";
import { getFirebaseMessaging } from "../firebase/firebase";
import { disablePushSubscription, savePushSubscription } from "./subscriptions";

export type NotificationPermissionState = NotificationPermission | "unsupported";

export async function isWebPushSupported(): Promise<boolean> {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && Boolean(await getFirebaseMessaging());
}

export function getCurrentNotificationPermission(): NotificationPermissionState {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}

async function registration() {
  const existing = await navigator.serviceWorker.ready;
  if (!existing) throw new Error("service_worker_unavailable");
  return existing;
}

export async function refreshWebPushToken(): Promise<string> {
  if (Notification.permission !== "granted") throw new Error("notification_permission_not_granted");
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey || vapidKey.includes("REPLACE_WITH")) throw new Error("firebase_vapid_key_missing");
  const messaging = await getFirebaseMessaging();
  if (!messaging) throw new Error("web_push_unsupported");
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: await registration() });
  if (!token) throw new Error("fcm_token_unavailable");
  await savePushSubscription(token, "web");
  localStorage.setItem("jbc:last-fcm-token", token);
  return token;
}

/** Call only from an explicit user gesture. */
export async function enableWebPushNotifications(): Promise<string> {
  if (!(await isWebPushSupported())) throw new Error("web_push_unsupported");
  if (Notification.permission === "denied") throw new Error("notification_permission_denied");
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "notification_permission_denied" : "notification_permission_dismissed");
  return refreshWebPushToken();
}

export async function disableWebPushNotifications(): Promise<void> {
  const token = localStorage.getItem("jbc:last-fcm-token") || undefined;
  await disablePushSubscription(token);
  const messaging = await getFirebaseMessaging();
  if (messaging) await deleteToken(messaging).catch(() => false);
  localStorage.removeItem("jbc:last-fcm-token");
}
