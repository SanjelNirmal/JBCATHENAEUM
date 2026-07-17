import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { Seo } from "./Seo";
import { useEffect } from "react";
import { recordClientError } from "../lib/monitoring";

export function RouteErrorBoundary() {
  const error = useRouteError();
  useEffect(() => recordClientError("route_error", error), [error]);
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-5 py-24 text-center"
    >
      <Seo
        title={notFound ? "Page not found" : "Page error"}
        description="The requested page could not be displayed."
        path={window.location.pathname}
        noIndex
      />
      <p className="text-sm font-bold uppercase tracking-widest text-[#c49b63]">
        {notFound ? "404" : "Error"}
      </p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-[#002147]">
        {notFound ? "Page not found" : "This page could not be loaded"}
      </h1>
      <p className="mt-4 text-slate-600">
        Check the address or return to the resource catalog.
      </p>
      <Link
        to="/resources"
        className="mt-8 inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
      >
        Browse resources
      </Link>
    </main>
  );
}
