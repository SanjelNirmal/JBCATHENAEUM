import { Bell, X } from "lucide-react";
import { useCurrentAuth } from "../../app/AuthContext";
import { useForegroundNotifications } from "../../hooks/useForegroundNotifications";
import { openNotificationRoute } from "../../lib/notifications/safety";

export function ForegroundNotificationManager() {
  const auth = useCurrentAuth();
  const { notification, dismiss } = useForegroundNotifications(Boolean(auth.user));
  if (!notification) return null;
  return (
    <aside aria-live="polite" className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border border-[#d8b37a] bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <Bell className="shrink-0 text-[#85591f]" aria-hidden="true" />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { openNotificationRoute(notification.url); dismiss(); }}>
          <strong className="block text-[#001b3a]">{notification.title}</strong>
          <span className="mt-1 block text-sm text-slate-600">{notification.body}</span>
        </button>
        <button type="button" aria-label="Dismiss notification" onClick={dismiss} className="min-h-11 min-w-11"><X className="mx-auto" size={18} /></button>
      </div>
    </aside>
  );
}
