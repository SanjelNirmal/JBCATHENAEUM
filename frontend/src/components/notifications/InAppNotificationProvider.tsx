import { AnimatePresence } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentAuth } from "../../app/AuthContext";
import { useNotificationPreferences } from "../../features/engagement/hooks";
import { platformRuntime } from "../../platform";
import {
  subscribeToForegroundMessages,
  type ForegroundMessage,
} from "../../lib/notifications/foregroundMessaging";
import {
  initializeNotificationSoundInteractionTracking,
  playForegroundNotificationSound,
} from "../../lib/notifications/foregroundSound";
import {
  initializeNativePush,
  removeNativePushListeners,
} from "../../lib/notifications/nativePush";
import { safeNotificationRoute } from "../../lib/notifications/safety";
import { markNotificationRead } from "../../lib/supabase/notifications";
import type { NotificationPreferences } from "../../lib/supabase/notificationPreferences";
import { InAppNotificationToast } from "./InAppNotificationToast";

interface NotificationContextValue {
  showNotification: (notification: ForegroundMessage) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
const MAX_VISIBLE = 3;

function quietHoursActive(preferences: NotificationPreferences): boolean {
  if (
    !preferences.quietHoursEnabled ||
    !preferences.quietHoursStart ||
    !preferences.quietHoursEnd
  ) {
    return false;
  }
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: preferences.timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const current = `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
    const start = preferences.quietHoursStart.slice(0, 5);
    const end = preferences.quietHoursEnd.slice(0, 5);
    return start <= end
      ? current >= start && current < end
      : current >= start || current < end;
  } catch {
    return false;
  }
}

function categoryMuted(category: string, preferences: NotificationPreferences): boolean {
  if (category === "account_security") return !preferences.accountSecurity;
  if (category === "past_question") return !preferences.pastQuestions;
  if (category === "new_resource") return !preferences.newResources;
  if (category === "administrative_announcement") return !preferences.systemAnnouncements;
  return !preferences.resourceUpdates;
}

function nativeMessage(value: {
  title?: string;
  body?: string;
  id: string;
  data?: Record<string, unknown>;
}): ForegroundMessage {
  const data = value.data ?? {};
  return {
    title: value.title?.trim().slice(0, 120) || "JBC Athenaeum",
    body: value.body?.trim().slice(0, 500) || "A new academic update is available.",
    url: safeNotificationRoute(data.url),
    notificationId: String(data.notificationId || value.id).slice(0, 160),
    resourceId: typeof data.resourceId === "string" ? data.resourceId : null,
    category: typeof data.category === "string" ? data.category : "academic_update",
    icon: "/icons/icon-192.png",
    timestamp: Number(data.timestamp) || Date.now(),
  };
}

export function InAppNotificationProvider({ children }: { children: ReactNode }) {
  const auth = useCurrentAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const preferences = useNotificationPreferences(auth.user?.id);
  const [notifications, setNotifications] = useState<ForegroundMessage[]>([]);
  const queuedIds = useRef(new Set<string>());

  const dismiss = useCallback((notificationId: string) => {
    queuedIds.current.delete(notificationId);
    setNotifications((current) =>
      current.filter((item) => item.notificationId !== notificationId),
    );
  }, []);

  const showNotification = useCallback(
    (notification: ForegroundMessage) => {
      const currentPreferences = preferences.data;
      if (
        !auth.user ||
        !currentPreferences?.inAppEnabled ||
        !currentPreferences.foregroundPopupEnabled ||
        queuedIds.current.has(notification.notificationId)
      ) {
        return;
      }
      queuedIds.current.add(notification.notificationId);
      setNotifications((current) => [...current, notification]);
      void playForegroundNotificationSound({
        enabled: currentPreferences.notificationSoundEnabled,
        quietHoursActive: quietHoursActive(currentPreferences),
        categoryMuted: categoryMuted(notification.category, currentPreferences),
      });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, [auth.user, preferences.data, queryClient],
  );

  useEffect(() => initializeNotificationSoundInteractionTracking(), []);

  useEffect(() => {
    if (!auth.user) return;
    if (platformRuntime.isNative()) {
      void initializeNativePush((value) => showNotification(nativeMessage(value)));
      return () => {
        void removeNativePushListeners();
      };
    }
    return subscribeToForegroundMessages(showNotification);
  }, [auth.user, showNotification]);

  useEffect(() => {
    const testPopup = () =>
      showNotification({
        title: "JBC Athenaeum notification",
        body: "Your foreground notification popup is working correctly.",
        url: "/notifications",
        notificationId: `test-${Date.now()}`,
        resourceId: null,
        category: "administrative_announcement",
        icon: "/icons/icon-192.png",
        timestamp: Date.now(),
      });
    window.addEventListener("jbc:test-foreground-notification", testPopup);
    return () => window.removeEventListener("jbc:test-foreground-notification", testPopup);
  }, [showNotification]);

  const open = useCallback(
    (notification: ForegroundMessage) => {
      dismiss(notification.notificationId);
      void markNotificationRead(notification.notificationId)
        .catch(() => undefined)
        .finally(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
      navigate(safeNotificationRoute(notification.url));
    },
    [dismiss, navigate, queryClient],
  );

  const contextValue = useMemo(() => ({ showNotification }), [showNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[90] mx-auto flex max-w-[24rem] flex-col gap-3 min-[960px]:left-auto min-[960px]:right-5 min-[960px]:top-24 min-[960px]:mx-0 min-[960px]:w-[23rem]">
        <AnimatePresence initial={false}>
          {notifications.slice(0, MAX_VISIBLE).map((notification) => (
            <InAppNotificationToast
              key={notification.notificationId}
              notification={notification}
              onDismiss={dismiss}
              onOpen={open}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useInAppNotifications(): NotificationContextValue {
  const value = useContext(NotificationContext);
  if (!value) throw new Error("useInAppNotifications must be used inside InAppNotificationProvider");
  return value;
}
