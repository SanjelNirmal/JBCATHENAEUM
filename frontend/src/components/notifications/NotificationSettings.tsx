import { Bell, BellOff, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { platformRuntime } from "../../platform";
import { disablePushNotifications, enablePushNotifications, getPushNotificationState } from "../../lib/notifications/pushNotifications";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

type State = Awaited<ReturnType<typeof getPushNotificationState>>;

export function NotificationSettings({ onEnabledChange }: { onEnabledChange?: (enabled: boolean) => void }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = async () => setState(await getPushNotificationState());
  useEffect(() => { void load(); }, []);
  const act = async (enable: boolean) => {
    setBusy(true); setMessage("");
    try {
      if (enable) await enablePushNotifications(); else await disablePushNotifications();
      onEnabledChange?.(enable);
      setMessage(enable ? "Push notifications enabled on this device." : "Push notifications disabled on this device.");
      await load();
    } catch (error) { setMessage(toSafeErrorMessage(error)); } finally { setBusy(false); }
  };
  const denied = state?.permission === "denied";
  const iosWeb = !platformRuntime.isNative() && /iPhone|iPad/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches;
  return (
    <section className="rounded-xl border border-[#d8b37a] bg-white p-5 sm:p-7" aria-labelledby="push-settings-title">
      <div className="flex items-center gap-3"><Bell className="text-[#85591f]" /><h2 id="push-settings-title" className="text-xl font-bold text-[#001b3a]">Push delivery</h2></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Platform</dt><dd className="font-semibold capitalize">{state?.platform || "Checking…"}</dd></div>
        <div><dt className="text-slate-500">Permission</dt><dd className="font-semibold capitalize">{String(state?.permission || "Checking…")}</dd></div>
        <div><dt className="text-slate-500">Support</dt><dd className="font-semibold">{state?.supported ? "Supported" : "Unavailable"}</dd></div>
        <div><dt className="text-slate-500">Last registered</dt><dd className="font-semibold">{state?.lastRegisteredAt ? new Date(state.lastRegisteredAt).toLocaleString() : "Not registered"}</dd></div>
      </dl>
      {denied && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Permission is blocked. Enable notifications for this site in your browser or system settings, then return here.</p>}
      {iosWeb && <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">On iPhone or iPad, add JBC Athenaeum to the Home Screen first, then open the installed app to enable web push.</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={busy || denied || !state?.supported} onClick={() => void act(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#001b3a] px-5 font-bold text-white disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={18} /> : <Bell size={18} />}Enable</button>
        <button type="button" disabled={busy || !state?.supported} onClick={() => void act(false)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-5 font-bold"><BellOff size={18} />Disable</button>
      </div>
    </section>
  );
}
