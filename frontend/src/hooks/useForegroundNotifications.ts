import { useEffect, useRef, useState } from "react";
import { onMessage } from "firebase/messaging";
import { platformRuntime } from "../platform";
import { getFirebaseMessaging } from "../lib/firebase/firebase";
import { initializeNativePush, removeNativePushListeners } from "../lib/notifications/nativePush";
import { safeNotificationRoute } from "../lib/notifications/safety";

export interface ForegroundNotification { title: string; body: string; url: string; id: string; }

export function useForegroundNotifications(enabled: boolean) {
  const [notification, setNotification] = useState<ForegroundNotification | null>(null);
  const lastId = useRef("");
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    const accept = (title: string, body: string, url: unknown, id: string) => {
      if (!id || id === lastId.current || disposed) return;
      lastId.current = id;
      setNotification({ title, body, url: safeNotificationRoute(url), id });
    };
    if (platformRuntime.isNative()) {
      void initializeNativePush((value) => accept(value.title || "JBC Athenaeum", value.body || "A new update is available.", value.data?.url, String(value.data?.notificationId || value.id)));
    } else {
      void getFirebaseMessaging().then((messaging) => {
        if (!messaging || disposed) return;
        unsubscribe = onMessage(messaging, (payload) => {
          const data = payload.data || {};
          accept(payload.notification?.title || data.title || "JBC Athenaeum", payload.notification?.body || data.body || "A new update is available.", data.url, data.notificationId || payload.messageId);
        });
      });
    }
    return () => { disposed = true; unsubscribe?.(); if (platformRuntime.isNative()) void removeNativePushListeners(); };
  }, [enabled]);
  return { notification, dismiss: () => setNotification(null) };
}
