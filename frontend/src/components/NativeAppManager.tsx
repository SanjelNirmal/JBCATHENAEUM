import { App } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { dismissTopNativeOverlay } from "../platform/backNavigation";
import { navigationAdapter, parseDeepLink, platformRuntime } from "../platform";

export function NativeAppManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    if (!platformRuntime.isNative()) return;
    let disposed = false;
    const handles: PluginListenerHandle[] = [];
    let lastHandledUrl = "";

    const openAppUrl = (value: string) => {
      if (value === lastHandledUrl) return;
      lastHandledUrl = value;
      const destination = parseDeepLink(value);
      navigate(destination?.route || "/not-found", {
        replace: destination?.replace ?? true,
      });
    };

    const addListeners = async () => {
      const appUrl = await App.addListener("appUrlOpen", ({ url }) => {
        openAppUrl(url);
      });
      const back = await App.addListener("backButton", () => {
        if (dismissTopNativeOverlay()) return;
        const index = Number(window.history.state?.idx ?? 0);
        if (index > 0) {
          navigate(-1);
          return;
        }
        if (locationRef.current.pathname !== "/") {
          navigate("/", { replace: true });
          return;
        }
        void App.exitApp();
      });
      if (disposed) {
        await appUrl.remove();
        await back.remove();
        return;
      }
      handles.push(appUrl, back);

      const launch = await App.getLaunchUrl();
      if (!disposed && launch?.url) openAppUrl(launch.url);
    };

    const handleInternalNavigation = (event: Event) => {
      const route = (event as CustomEvent<unknown>).detail;
      if (typeof route === "string" && route.startsWith("/resources/")) {
        navigate(route);
      }
    };

    const handleExternalAnchor = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const element = event.target;
      if (!(element instanceof Element)) return;
      const anchor = element.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const rawHref = anchor.getAttribute("href") || "";
      if (
        rawHref.startsWith("/") ||
        rawHref.startsWith("#") ||
        (!rawHref.includes(":") && !anchor.target)
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        event.preventDefault();
        return;
      }
      const internal = parseDeepLink(url.toString());
      event.preventDefault();
      if (internal) {
        navigate(internal.route, { replace: internal.replace });
        return;
      }
      void navigationAdapter.openExternal(url.toString()).catch(() => {
        // Untrusted external URLs are deliberately ignored.
      });
    };

    window.addEventListener("jbc:navigate", handleInternalNavigation);
    document.addEventListener("click", handleExternalAnchor);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations.map((registration) => registration.unregister()),
          ),
        );
    }
    void addListeners();

    return () => {
      disposed = true;
      window.removeEventListener("jbc:navigate", handleInternalNavigation);
      document.removeEventListener("click", handleExternalAnchor);
      void Promise.all(handles.map((handle) => handle.remove()));
    };
  }, [navigate]);

  return null;
}
