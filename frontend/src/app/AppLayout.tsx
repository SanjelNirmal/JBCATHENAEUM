import { Outlet, ScrollRestoration } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { PwaManager } from "../components/PwaManager";
import { NativeAppManager } from "../components/NativeAppManager";
import { OfflineBanner } from "../components/OfflineBanner";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-[calc(4.75rem+env(safe-area-inset-bottom))] text-slate-900 min-[960px]:pb-0">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-white px-4 py-3 font-bold text-[#002147] shadow focus:translate-y-0"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
      <PwaManager />
      <OfflineBanner />
      <NativeAppManager />
      <ScrollRestoration />
    </div>
  );
}
