import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (dismissed || (!offlineReady && !needRefresh && !installPrompt))
    return null;
  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };
  const dismiss = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setDismissed(true);
  };
  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-xl rounded-xl border border-slate-300 bg-white p-4 shadow-2xl min-[960px]:bottom-5"
    >
      <div className="flex items-start gap-3">
        {needRefresh ? (
          <RefreshCw className="shrink-0 text-[#85591f]" aria-hidden="true" />
        ) : offlineReady ? (
          <WifiOff className="shrink-0 text-[#85591f]" aria-hidden="true" />
        ) : (
          <Download className="shrink-0 text-[#85591f]" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#002147]">
            {needRefresh
              ? "Update available"
              : offlineReady
                ? "Offline shell ready"
                : "Install JBC Athenaeum"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {needRefresh
              ? "Reload to use the newest version."
              : offlineReady
                ? "Public application pages can reopen offline. Account data and documents still require connectivity."
                : "Add the academic archive to this device for faster access."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {needRefresh && (
              <button
                type="button"
                onClick={() => void updateServiceWorker(true)}
                className="min-h-11 rounded-lg bg-[#002147] px-4 text-sm font-bold text-white"
              >
                Reload
              </button>
            )}
            {!needRefresh && installPrompt && (
              <button
                type="button"
                onClick={() => void install()}
                className="min-h-11 rounded-lg bg-[#002147] px-4 text-sm font-bold text-white"
              >
                Install app
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss app notice"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
