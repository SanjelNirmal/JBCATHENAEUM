import { Bell, BellOff, LoaderCircle, Play, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrentAuth } from "../../app/AuthContext";
import { platformRuntime } from "../../platform";
import { playNotificationTestSound } from "../../lib/notifications/foregroundSound";
import { disablePushNotifications, enablePushNotifications, getPushNotificationState } from "../../lib/notifications/pushNotifications";
import { supabase } from "../../lib/supabase/client";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

type State = Awaited<ReturnType<typeof getPushNotificationState>>;

export function NotificationSettings({ onEnabledChange }: { onEnabledChange?: (enabled: boolean) => void }) {
  const auth = useCurrentAuth();
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
  const canSendTestPush = auth.profile?.role === "admin" || auth.profile?.role === "super_admin";
  const iosWeb = !platformRuntime.isNative() && /iPhone|iPad/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches;
  const testSound = async () => {
    const played = await playNotificationTestSound();
    setMessage(played ? "Test sound played." : "The browser or device prevented audio playback.");
  };
  const testPopup = () => {
    window.dispatchEvent(new Event("jbc:test-foreground-notification"));
    setMessage("Test foreground popup requested.");
  };
  const testPush = async () => {
    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: "JBC Athenaeum test notification",
          body: "Background push delivery is configured for this device.",
          category: "administrative_announcement",
          targetUrl: "/notifications",
          testOnly: true,
          testSubscriptionId: state?.currentSubscriptionId || undefined,
        },
      });
      if (error) throw error;
      setMessage(`Test push complete: ${Number(data?.sent ?? 0)} device delivery sent.`);
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="rounded-xl border border-[#d8b37a] bg-white p-5 sm:p-7" aria-labelledby="push-settings-title">
      <div className="flex items-center gap-3"><Bell className="text-[#85591f]" /><h2 id="push-settings-title" className="text-xl font-bold text-[#001b3a]">Push delivery</h2></div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-slate-500">Platform</dt><dd className="font-semibold capitalize">{state?.platform || "Checking…"}</dd></div>
        <div><dt className="text-slate-500">Permission</dt><dd className="font-semibold capitalize">{String(state?.permission || "Checking…")}</dd></div>
        <div><dt className="text-slate-500">Support</dt><dd className="font-semibold">{state?.supported ? "Supported" : "Unavailable"}</dd></div>
        <div><dt className="text-slate-500">Service worker</dt><dd className="font-semibold">{state?.serviceWorkerStatus || "Checking…"}</dd></div>
        <div><dt className="text-slate-500">FCM registration</dt><dd className="font-semibold">{state?.fcmRegistrationStatus || "Checking…"}</dd></div>
        <div><dt className="text-slate-500">Current device</dt><dd className="font-semibold">{state?.currentDeviceEnabled ? "Enabled" : "Disabled"}</dd></div>
        <div><dt className="text-slate-500">Last registered</dt><dd className="font-semibold">{state?.lastRegisteredAt ? new Date(state.lastRegisteredAt).toLocaleString() : "Not registered"}</dd></div>
      </dl>
      {denied && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Permission is blocked. Enable notifications for this site in your browser or system settings, then return here.</p>}
      {iosWeb && <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">On iPhone or iPad, add JBC Athenaeum to the Home Screen first, then open the installed app to enable web push.</p>}
      {message && <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={busy || denied || !state?.supported} onClick={() => void act(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#001b3a] px-5 font-bold text-white disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={18} /> : <Bell size={18} />}Enable</button>
        <button type="button" disabled={busy || !state?.supported} onClick={() => void act(false)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-5 font-bold"><BellOff size={18} />Disable</button>
      </div>
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="font-bold text-[#001b3a]">Test notification experience</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={testPopup} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold"><Sparkles size={17} />Test foreground popup</button>
          <button type="button" onClick={() => void testSound()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold"><Play size={17} />Play test sound</button>
          <button type="button" disabled={busy || !state?.currentDeviceEnabled || !canSendTestPush} onClick={() => void testPush()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-bold disabled:opacity-50"><Send size={17} />Send test push to this device</button>
        </div>
        {!canSendTestPush && <p className="mt-2 text-xs text-slate-500">Test push sending is restricted to administrators with multi-factor authentication.</p>}
      </div>
      <div className="mt-5 rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <p>Foreground sound is played by the website only after you interact with the page.</p>
        <p className="mt-1">Background notification sound is controlled by the browser and operating system. Focus mode, a muted device, or browser and OS notification settings can suppress sound.</p>
      </div>
    </section>
  );
}
