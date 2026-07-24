import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Download,
  ExternalLink,
  FileWarning,
  Flag,
  RefreshCw,
  Share2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/AsyncState";
import { AcademicTrustSection } from "../components/AcademicTrustSection";
import { JsonLd } from "../components/JsonLd";
import { ResourceVerificationBadge } from "../components/ResourceVerificationBadge";
import { Seo } from "../components/Seo";
import { ResourceEngagementPanel } from "../features/engagement/ResourceEngagementPanel";
import { PublicResourceRatings } from "../features/engagement/PublicResourceRatings";
import { useCurrentAuth } from "../app/AuthContext";
import {
  fetchResource,
  fetchPublicContributorProfile,
  getLegacyPreviewUrl,
  getDownloadUrl,
  getPublicResourceAccessUrl,
  reportResource,
  searchResources,
} from "../lib/supabase/resources";
import { toSafeErrorMessage } from "../lib/supabase/errors";
import { navigationAdapter, publicAppUrl, shareAdapter } from "../platform";

export default function ResourceDetailPage() {
  const { resourceId = "" } = useParams();
  const auth = useCurrentAuth();
  const query = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => fetchResource(resourceId),
    enabled: Boolean(resourceId),
  });
  const contributorId = query.data?.contributorId ?? null;
  const contributorQuery = useQuery({
    queryKey: ["resource-contributor", contributorId],
    queryFn: () =>
      contributorId ? fetchPublicContributorProfile(contributorId) : null,
    enabled: Boolean(contributorId),
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [pendingDownloadCount, setPendingDownloadCount] = useState<
    number | null
  >(null);
  const relatedResources = useQuery({
    queryKey: ["resource-related", query.data?.subjectId, query.data?.id],
    queryFn: () =>
      searchResources(
        {
          q: "",
          subject: query.data!.subjectId,
          sort: "popular",
          page: 1,
          pageSize: 4,
        },
        undefined,
      ),
    enabled: Boolean(query.data?.subjectId),
  });
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
  const resourceUrl = publicAppUrl(`/resources/${item.slug}`);
  const openDocumentWindow = () => {
    const accessUrl = getPublicResourceAccessUrl(item.id);
    const viewerUrl = isLegacy
      ? accessUrl
      : `${accessUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
    void navigationAdapter.openExternal(viewerUrl).catch(() => {
      setReportMessage(
        "The document could not be opened. Refresh the preview and try again.",
      );
    });
  };
  const downloadDocument = () => {
    const downloadUrl = getDownloadUrl(item.id);
    const expectedCount = (pendingDownloadCount ?? item.downloadCount) + 1;
    void navigationAdapter.openExternal(downloadUrl).catch(() => {
      setReportMessage(
        "The document could not be downloaded. Refresh the preview and try again.",
      );
    });
    setPendingDownloadCount(expectedCount);
    window.setTimeout(() => {
      void query.refetch().then((result) => {
        if ((result.data?.downloadCount ?? 0) >= expectedCount) {
          setPendingDownloadCount(null);
        }
      });
    }, 1800);
  };
  const shareResource = async () => {
    setShareMessage("");
    try {
      const shareData = {
        title: item.title,
        url: resourceUrl,
      };
      const outcome = await shareAdapter.share(shareData);
      if (outcome === "copied") setShareMessage("Resource link copied.");
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
          title={item.seoTitle || item.title}
          description={
            item.seoDescription ||
            item.abstract ||
            item.description ||
            `Academic resource for ${item.subjectName}.`
          }
          path={`/resources/${item.slug}`}
        />
        <JsonLd
          id={`resource-${item.id}`}
          data={[
            {
              "@context": "https://schema.org",
              "@type": ["CreativeWork", "LearningResource", "DigitalDocument"],
              name: item.title,
              description:
                item.abstract || item.description || "Academic learning resource",
              inLanguage: "en",
              datePublished: item.createdAt,
              dateModified: item.updatedAt,
              url: resourceUrl,
              educationalUse: "study",
              learningResourceType: item.categoryName,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Resources",
                  item: "https://jbc.nirmalsanjel.com.np/resources",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: item.subjectName,
                  item: resourceUrl,
                },
              ],
            },
          ]}
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
            <div className="mb-4 rounded-2xl border border-[#c49b63]/30 bg-[#001b3a] p-5 text-white md:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8b37a]">
                Mobile PDF viewer
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold">
                Open the PDF in the reader
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Mobile browsers and app webviews do not reliably scroll embedded
                PDF previews. Open the document in the system PDF viewer for a
                readable, scrollable view.
              </p>
              <button
                type="button"
                onClick={openDocumentWindow}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d8b37a] px-5 font-bold text-[#001b3a] shadow-sm"
              >
                <ExternalLink aria-hidden="true" size={18} />
                Open PDF
              </button>
              <button
                type="button"
                onClick={downloadDocument}
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-5 font-bold text-white"
              >
                <Download aria-hidden="true" size={18} />
                Download PDF
              </button>
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-300 bg-slate-200 md:block">
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
                onClick={openDocumentWindow}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#002147] px-4 font-bold text-white"
              >
                <ExternalLink aria-hidden="true" size={17} />
                  Open PDF
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
                onClick={downloadDocument}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#002147] px-4 font-bold text-white"
              >
                <Download aria-hidden="true" size={17} />
                Download PDF
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
                  View external resource
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
              {item.abstract || item.description || "No description was provided."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.verificationLevel === "faculty_verified" && item.verifiedBy && (
                <ResourceVerificationBadge kind="faculty_verified" />
              )}
              <ResourceVerificationBadge kind="moderation_reviewed" />
              {item.contributorId && (
                <ResourceVerificationBadge kind="student_contributed" />
              )}
              {new Date(item.updatedAt).getTime() >
                new Date(item.createdAt).getTime() && (
                <ResourceVerificationBadge kind="updated_resource" />
              )}
              {item.downloadCount >= 50 && (
                <ResourceVerificationBadge kind="popular_resource" />
              )}
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Meta label="Program" value={item.programName} />
              <Meta
                label="Syllabus"
                value={item.curriculumName ?? "Unspecified syllabus"}
              />
              <Meta label="Term" value={item.termName} />
              {item.subjectCode && (
                <Meta label="Course code" value={item.subjectCode} />
              )}
              <Meta label="Subject" value={item.subjectName} />
              <Meta
                label="Academic year"
                value={String(item.academicYear ?? "—")}
              />
              <Meta label="Updated" value={new Date(item.updatedAt).toLocaleDateString()} />
              <Meta label="Views" value={item.viewCount.toLocaleString()} />
              <Meta label="Reviewed date" value={item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString() : "—"} />
              <Meta label="Verified date" value={item.verifiedAt ? new Date(item.verifiedAt).toLocaleDateString() : "—"} />
              <Meta label="Reviewer" value={item.verificationLevel === "faculty_verified" ? "Faculty reviewer" : "Moderation team"} />
              <Meta
                label="Contributor"
                value={
                  contributorQuery.data ? (
                    <Link
                      to={`/contributors/${contributorQuery.data.id}`}
                      className="font-semibold text-[#002147] underline-offset-2 hover:underline"
                    >
                      {contributorQuery.data.name}
                    </Link>
                  ) : (
                    item.contributorName
                  )
                }
              />
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
            <ResourceEngagementPanel resourceId={item.id} />
            <PublicResourceRatings resourceId={item.id} />
            <div className="mt-6 flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              <FileWarning className="shrink-0" size={19} />
              <p>
                {isLegacy
                  ? "External previews may fail if the provider changes sharing permissions."
                  : "Preview access is short-lived. Refresh this page if the signed preview expires."}
              </p>
            </div>
            {(item.topicsCovered.length > 0 || item.learningOutcomes.length > 0) && (
              <section className="mt-6 border-t border-slate-200 pt-6">
                <h2 className="font-serif text-xl font-bold text-[#002147]">
                  What this resource covers
                </h2>
                {item.topicsCovered.length > 0 && (
                  <>
                    <h3 className="mt-4 text-sm font-bold text-slate-700">Topics</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {item.topicsCovered.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  </>
                )}
                {item.learningOutcomes.length > 0 && (
                  <>
                    <h3 className="mt-4 text-sm font-bold text-slate-700">
                      Learning outcomes
                    </h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {item.learningOutcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}
          </aside>
        </div>
        <section className="mt-10">
          <h2 className="font-serif text-3xl font-bold text-[#002147]">
            Related resources
          </h2>
          {relatedResources.isLoading ? (
            <LoadingState label="Loading related resources" />
          ) : relatedResources.data?.items?.length ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedResources.data.items
                .filter((related) => related.id !== item.id)
                .slice(0, 3)
                .map((related) => (
                  <Link
                    key={related.id}
                    to={`/resources/${related.slug}`}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
                      {related.programName} · {related.termName}
                    </p>
                    <h3 className="mt-2 font-bold text-[#002147]">{related.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {related.downloadCount.toLocaleString()} downloads
                    </p>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No related resources are currently published.
            </p>
          )}
        </section>
        <section className="mt-10">
          <AcademicTrustSection compact />
        </section>
      </main>
    </>
  );
}
function Meta({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
