import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, LoaderCircle, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { useDialogFocus } from "../../lib/useDialogFocus";
import { safeNotificationRoute } from "../../lib/notifications/safety";
import {
  fetchNotificationPage,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../../lib/supabase/notifications";

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (elapsed < 60_000) return "Now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}

export function NotificationCenter() {
  const auth = useCurrentAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);

  const unread = useQuery({
    queryKey: ["notifications", "unread-count", auth.user?.id],
    queryFn: fetchUnreadNotificationCount,
    enabled: Boolean(auth.user),
    refetchInterval: 60_000,
  });
  const notifications = useInfiniteQuery({
    queryKey: ["notifications", "center", auth.user?.id],
    queryFn: ({ pageParam }) => fetchNotificationPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: Boolean(auth.user && open),
  });
  const items = notifications.data?.pages.flatMap((page) => page.items) ?? [];

  const close = useCallback(() => setOpen(false), []);
  useDialogFocus(open, panel, close);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [close, open]);

  const refresh = () => client.invalidateQueries({ queryKey: ["notifications"] });
  const openNotification = async (item: NotificationItem) => {
    close();
    if (!item.readAt) await markNotificationRead(item.id).catch(() => undefined);
    await refresh();
    navigate(safeNotificationRoute(item.targetUrl));
  };
  const markOne = async (item: NotificationItem) => {
    setMessage("");
    try {
      await markNotificationRead(item.id);
      await refresh();
    } catch {
      setMessage("The notification could not be marked as read.");
    }
  };
  const markAll = async () => {
    setMessage("");
    try {
      await markAllNotificationsRead();
      await refresh();
    } catch {
      setMessage("Notifications could not be updated.");
    }
  };
  const count = unread.data ?? 0;

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-[#002147]"
      >
        <Bell size={18} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-black text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div onClick={close} className="fixed inset-0 z-[79] bg-slate-950/45 min-[960px]:bg-transparent" aria-hidden="true" />
          <section
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notification-center-title"
            className="safe-area-bottom fixed inset-x-0 bottom-0 z-[80] flex max-h-[82dvh] flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl min-[960px]:absolute min-[960px]:inset-x-auto min-[960px]:bottom-auto min-[960px]:right-0 min-[960px]:top-12 min-[960px]:max-h-[min(72vh,42rem)] min-[960px]:w-[25rem] min-[960px]:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 id="notification-center-title" className="text-lg font-extrabold text-[#002147]">Notifications</h2>
                <p className="text-xs text-slate-500">Latest JBC Athenaeum updates</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={count === 0}
                  onClick={() => void markAll()}
                  className="min-h-10 rounded-lg px-2 text-xs font-bold text-blue-800 disabled:opacity-40"
                >
                  Mark all read
                </button>
                <button data-autofocus type="button" aria-label="Close notifications" onClick={close} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
            </div>
            {message && <p role="status" className="mx-4 mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-800">{message}</p>}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {notifications.isLoading ? (
                <div className="flex min-h-44 items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle className="animate-spin" size={18} /> Loading notifications…</div>
              ) : notifications.isError ? (
                <div className="p-6 text-center"><p className="text-sm text-red-700">Notifications could not be loaded.</p><button type="button" onClick={() => void notifications.refetch()} className="mt-3 min-h-10 rounded-lg border px-4 text-sm font-bold">Try again</button></div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center"><Bell className="mx-auto text-slate-300" size={32} /><p className="mt-3 font-bold text-[#002147]">You’re all caught up</p><p className="mt-1 text-sm text-slate-500">New academic and account updates will appear here.</p></div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <li key={item.id} className={item.readAt ? "bg-white" : "bg-blue-50/70"}>
                      <div className="flex gap-3 px-4 py-3">
                        <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-blue-600"}`} aria-hidden="true" />
                        <button type="button" onClick={() => void openNotification(item)} className="min-w-0 flex-1 rounded text-left focus-visible:outline-2">
                          <span className="block text-sm font-extrabold text-[#002147]">{item.title}</span>
                          <span className="mt-1 line-clamp-2 block text-sm leading-5 text-slate-600">{item.message}</span>
                          <span className="mt-1.5 block text-xs font-semibold text-blue-700">{relativeTime(item.createdAt)}</span>
                        </button>
                        {!item.readAt && (
                          <button type="button" aria-label={`Mark ${item.title} as read`} onClick={() => void markOne(item)} className="inline-flex min-h-9 min-w-9 items-center justify-center self-center rounded-full text-slate-500 hover:bg-white">
                            <Check size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {notifications.hasNextPage && (
              <button type="button" disabled={notifications.isFetchingNextPage} onClick={() => void notifications.fetchNextPage()} className="min-h-11 border-t border-slate-200 text-sm font-bold text-blue-800 disabled:opacity-50">
                {notifications.isFetchingNextPage ? "Loading…" : "Load older notifications"}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
