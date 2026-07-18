import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ExternalLink,
  FileWarning,
  Flag,
  RefreshCw,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/AsyncState";
import { BuyMeACoffeeModal } from "../components/BuyMeACoffeeModal";
import { Seo } from "../components/Seo";
import { useCurrentAuth } from "../app/AuthContext";
import {
  fetchResource,
  getLegacyPreviewUrl,
  getPublicResourceAccessUrl,
  reportResource,
} from "../lib/supabase/resources";
import { toSafeErrorMessage } from "../lib/supabase/errors";

export default function ResourceDetailPage() {
  const { resourceId = "" } = useParams();
  const auth = useCurrentAuth();
  const query = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => fetchResource(resourceId),
    enabled: Boolean(resourceId),
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [coffeeOpen, setCoffeeOpen] = useState(false);
  const [pendingViewerUrl, setPendingViewerUrl] = useState("");
  const [pendingDownloadCount, setPendingDownloadCount] = useState<
    number | null
  >(null);
  if (query.isLoading)
    return (
      <main id="main-content">
        <LoadingState label="Loading resource" />
      </main>
    );
  if (query.isError)
    return (
      <main id="main-content" className="px-5 py-20">
        <ErrorState
          message="The resource could not be loaded."
          retry={() => void query.refetch()}
        />
      </main>
    );
  if (!query.data)
    return (
      <main
        id="main-content"
        className="mx-auto max-w-3xl px-5 py-24 text-center"
      >
        <Seo
          title="Resource not found"
          description="This resource does not exist or is not published."
          path={window.location.pathname}
          noIndex
        />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Resource not found
        </h1>
        <p className="mt-4 text-slate-600">
          It may have been archived or the link may be incorrect.
        </p>
        <Link
          to="/resources"
          className="mt-7 inline-flex rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
        >
          Return to catalog
        </Link>
      </main>
    );
  const item = query.data;
  const isLegacy = Boolean(item.legacyUrl);
  const basePreviewUrl = item.legacyUrl
    ? getLegacyPreviewUrl(item.legacyUrl)
    : getPublicResourceAccessUrl(item.id);
  const previewUrl = item.legacyUrl
    ? basePreviewUrl
    : `${basePreviewUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  const resourceUrl = `${window.location.origin}/resources/${item.slug}`;
  const prepareDocument = () => {
    const accessUrl = `${getPublicResourceAccessUrl(item.id)}&open=1`;
    setPendingViewerUrl(
      isLegacy
        ? accessUrl
        : `${accessUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`,
    );
    setCoffeeOpen(true);
  };
  const cancelDocumentOpen = () => {
    setCoffeeOpen(false);
    setPendingViewerUrl("");
  };
  const openDocumentWindow = () => {
    if (!pendingViewerUrl) return;
    const expectedCount = (pendingDownloadCount ?? item.downloadCount) + 1;
    setPendingDownloadCount(expectedCount);
    window.open(pendingViewerUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => {
      void query.refetch().then((result) => {
        if ((result.data?.downloadCount ?? 0) >= expectedCount) {
          setPendingDownloadCount(null);
        }
      });
    }, 1800);
    setCoffeeOpen(false);
    setPendingViewerUrl("");
  };
  const shareResource = async () => {
    setShareMessage("");
    try {
      const shareData = {
        title: item.title,
        text: item.description || `Academic resource for ${item.subjectName}.`,
        url: resourceUrl,
      };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(resourceUrl);
      setShareMessage("Resource link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareMessage("The share link could not be copied.");
    }
  };
  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await reportResource(
        item.id,
        String(form.get("reason") ?? ""),
        String(form.get("details") ?? ""),
      );
      setReportMessage("Report submitted for administrator review.");
      setReportOpen(false);
    } catch (error) {
      setReportMessage(toSafeErrorMessage(error, "resource"));
    }
  };
  return (
    <>
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <Seo
          title={item.title}
          description={
            item.description || `Academic resource for ${item.subjectName}.`
          }
          path={`/resources/${item.slug}`}
        />
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link to="/resources" className="underline">
            Resources
          </Link>{" "}
          <span aria-hidden="true">/</span> {item.subjectName}
        </nav>
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section>
            {isLegacy && (
              <div
                role="status"
                className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
              >
                <FileWarning className="shrink-0" size={19} />
                <p>
                  This is a legacy document hosted by an approved external
                  Google domain. JBC Athenaeum cannot guarantee its availability
                  or download behavior.
                </p>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-200">
              <iframe
                title={`Preview of ${item.title}`}
                src={previewUrl}
                referrerPolicy="no-referrer"
                scrolling="yes"
                className="h-[70vh] min-h-[30rem] w-full touch-pan-y overflow-y-auto bg-white"
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Preview access is temporary. Refresh this page if the viewer
              expires.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={prepareDocument}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#002147] px-4 font-bold text-white"
              >
                <ExternalLink aria-hidden="true" size={17} />
                Open in new window
              </button>
              <button
                type="button"
                onClick={() => void shareResource()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#002147] px-4 font-bold text-white"
              >
                <Share2 size={17} />
                Share resource
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-bold"
              >
                <RefreshCw size={17} />
                Refresh preview
              </button>
              {isLegacy && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#002147] px-4 font-bold text-white"
                >
                  <ExternalLink aria-hidden="true" size={17} />
                  Open external source
                </a>
              )}
              {auth.user ? (
                <button
                  onClick={() => setReportOpen((value) => !value)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 font-bold text-red-700"
                >
                  <Flag size={17} />
                  Report resource
                </button>
              ) : (
                <Link
                  to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 font-bold"
                >
                  Sign in to report
                </Link>
              )}
            </div>
            {shareMessage && (
              <p
                aria-live="polite"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 p-3 text-sm"
              >
                <Check size={16} />
                {shareMessage}
              </p>
            )}
            {reportMessage && (
              <p
                aria-live="polite"
                className="mt-3 rounded-lg bg-slate-100 p-3 text-sm"
              >
                {reportMessage}
              </p>
            )}
            {reportOpen && (
              <form
                onSubmit={submitReport}
                className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5"
              >
                <h2 className="font-bold text-[#002147]">
                  Report this resource
                </h2>
                <label className="block text-sm font-semibold">
                  Reason
                  <input
                    name="reason"
                    required
                    minLength={3}
                    maxLength={120}
                    className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Details
                  <textarea
                    name="details"
                    maxLength={4000}
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-slate-300 p-3"
                  />
                </label>
                <button className="min-h-11 rounded-lg bg-red-700 px-5 font-bold text-white">
                  Submit report
                </button>
              </form>
            )}
          </section>
          <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
              {item.categoryName}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold text-[#002147]">
              {item.title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {item.description || "No description was provided."}
            </p>
            <dl className="mt-6 space-y-3 text-sm">
              <Meta label="Program" value={item.programName} />
              <Meta label="Term" value={item.termName} />
              <Meta label="Subject" value={item.subjectName} />
              <Meta
                label="Academic year"
                value={String(item.academicYear ?? "—")}
              />
              <Meta label="Contributor" value={item.contributorName} />
              <Meta
                label="File size"
                value={
                  item.byteSize
                    ? `${(item.byteSize / 1_048_576).toFixed(2)} MB`
                    : "—"
                }
              />
              <Meta label="Pages" value={String(item.pageCount ?? "—")} />
              <Meta
                label="Downloads"
                value={(
                  pendingDownloadCount ?? item.downloadCount
                ).toLocaleString()}
              />
            </dl>
            <div className="mt-6 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <FileWarning className="shrink-0" size={19} />
              <p>
                {isLegacy
                  ? "External previews may fail if the provider changes sharing permissions."
                  : "Preview access is short-lived. Refresh this page if the signed preview expires."}
              </p>
            </div>
          </aside>
        </div>
      </main>
      {coffeeOpen && (
        <BuyMeACoffeeModal
          onClose={cancelDocumentOpen}
          onContinue={openDocumentWindow}
          continueLabel="Maybe later — open document"
        />
      )}
    </>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
