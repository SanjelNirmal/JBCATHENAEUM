import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Seo } from "./Seo";
import { useEffect, useState } from "react";
import { recordClientError } from "../lib/monitoring";

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.name === "ChunkLoadError" ||
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("failed to load module script") ||
    message.includes("expected a javascript-or-wasm module script") ||
    message.includes("cannot read properties of undefined (reading 'default')") ||
    message.includes("error loading dynamically imported module")
  );
}

const CHUNK_RELOAD_KEY = "jbc:last-chunk-reload";
const CHUNK_RELOAD_COOLDOWN_MS = 30_000;
export const CHUNK_RECOVERY_PARAM = "__jbc_refresh";

async function reloadWithFreshAssets() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    }
    if ("caches" in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("workbox-precache") || name.startsWith("jbc-"),
          )
          .map((name) => window.caches.delete(name)),
      );
    }
  } catch {
    // Recovery still continues with a cache-busting navigation when browser
    // privacy settings prevent service-worker or Cache Storage access.
  }

  const next = new URL(window.location.href);
  next.searchParams.set(CHUNK_RECOVERY_PARAM, String(Date.now()));
  window.location.replace(next.toString());
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const [recovering, setRecovering] = useState(false);
  useEffect(() => recordClientError("route_error", error), [error]);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const chunkLoadError = isChunkLoadError(error);
  useEffect(() => {
    if (!chunkLoadError) return;
    const lastReload = Number(
      window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0",
    );
    const now = Date.now();
    if (now - lastReload < CHUNK_RELOAD_COOLDOWN_MS) return;
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    setRecovering(true);
    void reloadWithFreshAssets();
  }, [chunkLoadError]);
  const title = notFound
    ? "Page not found"
    : chunkLoadError
      ? "Update required"
      : "Page error";
  const heading = notFound
    ? "Page not found"
    : chunkLoadError
      ? "Reload this page"
      : "This page could not be loaded";
  const message = chunkLoadError
    ? recovering
      ? "Clearing the previous app version and loading the latest files…"
      : "The browser still has files from an older site version. Reload to clear them and fetch the latest version."
    : "Check the address or return to the resource catalog.";
  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-5 py-24 text-center"
    >
      <Seo
        title={title}
        description="The requested page could not be displayed."
        path={window.location.pathname}
        noIndex
      />
      <p className="text-sm font-bold uppercase tracking-widest text-[#c49b63]">
        {notFound ? "404" : "Error"}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-[#002147]">
        {heading}
      </h1>
      <p className="mt-4 text-slate-600">{message}</p>
      {chunkLoadError ? (
        <button
          type="button"
          disabled={recovering}
          onClick={() => {
            setRecovering(true);
            void reloadWithFreshAssets();
          }}
          className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
        >
          {recovering ? "Loading latest version…" : "Reload latest version"}
        </button>
      ) : (
        <Link
          to="/resources"
          className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
        >
          Browse resources
        </Link>
      )}
    </main>
  );
}
