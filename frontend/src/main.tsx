// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import App from "./App.tsx";
import { AuthProvider } from "./app/AuthContext.tsx";
import { ConfigurationErrorScreen } from "./components/ConfigurationErrorScreen.tsx";
import { CHUNK_RECOVERY_PARAM } from "./components/RouteErrorBoundary.tsx";
import { publicEnvironment } from "./lib/env.ts";
import { initializeClientMonitoring } from "./lib/monitoring.ts";
import { queryClient } from "./lib/supabase/queryClient.ts";

import "./index.css";

const CHUNK_RECOVERY_STORAGE_KEY =
  "jbc-chunk-recovery-attempted";

const CHUNK_ERROR_PATTERNS = [
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "ChunkLoadError",
  "Loading chunk",
  "Unable to preload CSS",
  "Failed to load module script",
  "error loading dynamically imported module",
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isStaleChunkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return CHUNK_ERROR_PATTERNS.some((pattern) =>
    message.includes(pattern.toLowerCase()),
  );
}

function recoverFromStaleDeployment(): void {
  const alreadyAttempted =
    sessionStorage.getItem(CHUNK_RECOVERY_STORAGE_KEY) === "true";

  if (alreadyAttempted) {
    return;
  }

  sessionStorage.setItem(CHUNK_RECOVERY_STORAGE_KEY, "true");

  const recoveryUrl = new URL(window.location.href);

  recoveryUrl.searchParams.set(
    CHUNK_RECOVERY_PARAM,
    Date.now().toString(),
  );

  window.location.replace(recoveryUrl.toString());
}

/**
 * Vite emits this event when a preloaded deployment asset no longer exists,
 * usually because a newer deployment replaced the previous hashed files.
 */
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverFromStaleDeployment();
});

/**
 * Handles stale module and chunk errors reported as regular browser errors.
 */
window.addEventListener("error", (event) => {
  const errorDetails =
    event.error ??
    event.message ??
    `${event.filename}:${event.lineno}:${event.colno}`;

  if (isStaleChunkError(errorDetails)) {
    event.preventDefault();
    recoverFromStaleDeployment();
  }
});

/**
 * Dynamic import failures are frequently reported as rejected promises
 * instead of regular window errors.
 */
window.addEventListener("unhandledrejection", (event) => {
  if (isStaleChunkError(event.reason)) {
    event.preventDefault();
    recoverFromStaleDeployment();
  }
});

/**
 * Remove the temporary recovery query parameter after the refreshed build
 * has started successfully.
 */
const startupUrl = new URL(window.location.href);
const startedFromChunkRecovery = startupUrl.searchParams.has(
  CHUNK_RECOVERY_PARAM,
);

if (startedFromChunkRecovery) {
  startupUrl.searchParams.delete(CHUNK_RECOVERY_PARAM);

  window.history.replaceState(
    window.history.state,
    "",
    `${startupUrl.pathname}${startupUrl.search}${startupUrl.hash}`,
  );
}

/**
 * Clear the reload guard only after the application has remained loaded.
 * This prevents an immediate infinite loop when the deployment is genuinely
 * unavailable or incorrectly configured.
 */
window.setTimeout(() => {
  sessionStorage.removeItem(CHUNK_RECOVERY_STORAGE_KEY);
}, 10_000);

initializeClientMonitoring();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    'Application root element with id "root" was not found.',
  );
}

createRoot(rootElement).render(
  <StrictMode>
    {publicEnvironment.issues.length > 0 ? (
      <ConfigurationErrorScreen
        issues={publicEnvironment.issues}
      />
    ) : (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    )}
  </StrictMode>,
);