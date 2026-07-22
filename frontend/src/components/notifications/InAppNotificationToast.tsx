import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ForegroundMessage } from "../../lib/notifications/foregroundMessaging";
import logo from "../../assets/logo.png";

interface Props {
  notification: ForegroundMessage;
  onDismiss: (notificationId: string) => void;
  onOpen: (notification: ForegroundMessage) => void;
}

function relativeTimestamp(timestamp: number): string {
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60_000) return "Now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export function InAppNotificationToast({
  notification,
  onDismiss,
  onOpen,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(7_000);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (paused) {
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
      return;
    }
    startedAt.current = Date.now();
    const timeout = window.setTimeout(
      () => onDismiss(notification.notificationId),
      remaining.current,
    );
    return () => window.clearTimeout(timeout);
  }, [notification.notificationId, onDismiss, paused]);

  return (
    <motion.aside
      role="status"
      aria-live="polite"
      layout
      initial={reducedMotion ? false : { opacity: 0, x: 24, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 18, scale: 0.97 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onDismiss(notification.notificationId);
      }}
      className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/98 p-3.5 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/98 dark:text-slate-100"
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 shrink-0">
          <img
            src={notification.icon || logo}
            onError={(event) => {
              event.currentTarget.src = logo;
            }}
            alt=""
            className="h-11 w-11 rounded-full border border-amber-200 bg-white object-contain p-1"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 dark:border-slate-900" />
        </div>
        <button
          type="button"
          onClick={() => onOpen(notification)}
          className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b7791f]"
        >
          <span className="block truncate pr-7 text-sm font-extrabold text-[#002147] dark:text-blue-100">
            {notification.title}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-slate-600 dark:text-slate-300">
            {notification.body}
          </span>
          <span className="mt-1.5 block text-xs font-semibold text-blue-700 dark:text-blue-300">
            {relativeTimestamp(notification.timestamp)}
          </span>
        </button>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss(notification.notificationId);
          }}
          className="absolute right-2 top-2 inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-2 dark:hover:bg-slate-800"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </motion.aside>
  );
}
