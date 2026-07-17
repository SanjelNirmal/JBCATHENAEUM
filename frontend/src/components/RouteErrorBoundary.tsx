import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Seo } from "./Seo";
import { useEffect } from "react";
import { recordClientError } from "../lib/monitoring";

function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.name === "ChunkLoadError" ||
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("error loading dynamically imported module")
  );
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  useEffect(() => recordClientError("route_error", error), [error]);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const chunkLoadError = isChunkLoadError(error);
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
    ? "The site was updated while this browser tab was open. Reload to fetch the latest files."
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
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
        >
          Reload page
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
