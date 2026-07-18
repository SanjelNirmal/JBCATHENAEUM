import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { fetchPublicStats, searchResources } from "../lib/supabase/resources";

export default function HomePage() {
  const recent = useQuery({
    queryKey: ["resources", "home"],
    queryFn: ({ signal }) =>
      searchResources({ q: "", sort: "recent", page: 1, pageSize: 5 }, signal),
  });
  const stats = useQuery({
    queryKey: ["public-stats"],
    queryFn: fetchPublicStats,
  });
  return (
    <main id="main-content">
      <Seo
        title="TU BCA & BICTE Notes & Academic Resources"
        description="Find reviewed JBC BCA notes, BICTE notes, past questions, project reports, PDFs, and academic resources for Jana Bhawana Campus students."
        path="/"
        keywords="Jana Bhawana Campus, JBC Athenaeum, JBC BCA notes, BCA notes, BICTE notes, TU notes, Tribhuvan University notes, BCA 4th semester notes, TU BCA resources, Jana Bhawana Campus notes, Nirmal Sanjel"
      />
      <section className="relative overflow-hidden bg-[#001b3a] text-white">
        <div
          aria-hidden="true"
          className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#c49b63]/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl lg:min-h-[38rem] lg:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
          <div className="flex flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:pl-8 xl:pr-20">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-[#d8b37a] sm:text-sm">
              <span aria-hidden="true" className="h-px w-9 bg-[#d8b37a]" />
              Jana Bhawana Campus
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
              TU BCA and BICTE notes, past questions, and campus resources.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Search reviewed notes, project reports, PDFs, past questions, and
              learning materials for Jana Bhawana Campus students. JBC
              Athenaeum is a moderated academic archive built for focused,
              reliable study.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/resources"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#c49b63] px-6 font-bold text-[#001b3a] transition hover:bg-[#d8b37a]"
              >
                Browse resources <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                to="/contribute"
                className="inline-flex min-h-12 items-center rounded-xl border border-white/40 px-6 font-bold text-white transition hover:border-white hover:bg-white/10"
              >
                Contribute a PDF
              </Link>
            </div>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tribhuvan University · Chapagaun, Lalitpur
            </p>
          </div>

          <figure className="group relative min-h-[25rem] overflow-hidden lg:min-h-full">
            <img
              src="/jana-bhawana-campus.jpg"
              alt="Red-brick Jana Bhawana Campus building in Chapagaun, Lalitpur"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#001b3a]/80 via-transparent to-[#001b3a]/10"
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-[#001b3a] to-transparent lg:block"
            />
            <div className="absolute left-5 top-5 border border-white/30 bg-[#001b3a]/75 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white backdrop-blur-sm sm:left-7 sm:top-7">
              Established academic community
            </div>
            <figcaption className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 border-l-2 border-[#c49b63] bg-[#001b3a]/85 px-5 py-4 backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7">
              <span>
                <span className="block text-xs uppercase tracking-[0.2em] text-[#d8b37a]">
                  Jana Bhawana Campus
                </span>
                <span className="mt-1 block text-sm font-semibold text-white">
                  Campus building · Chapagaun
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-white/25 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                TU BCA Archive
              </span>
            </figcaption>
          </figure>
        </div>
      </section>
      <section
        aria-labelledby="platform-stats"
        className="border-b border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-10">
          <h2 id="platform-stats" className="sr-only">
            Verified platform statistics
          </h2>
          {stats.isLoading ? (
            <LoadingState label="Loading archive statistics" />
          ) : stats.isError ? (
            <ErrorState
              message="Statistics are temporarily unavailable."
              retry={() => void stats.refetch()}
            />
          ) : (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[
                [
                  FileText,
                  "Published resources",
                  stats.data?.publishedResources,
                ],
                [GraduationCap, "Programs", stats.data?.programs],
                [BookOpen, "Subjects", stats.data?.subjects],
                [Download, "Recorded downloads", stats.data?.downloads],
              ].map(([Icon, label, value]) => {
                const ItemIcon = Icon as typeof FileText;
                return (
                  <div
                    key={String(label)}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <ItemIcon className="text-[#85591f]" aria-hidden="true" />
                    <p className="mt-3 text-3xl font-black text-[#002147]">
                      {Number(value ?? 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-600">{String(label)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <section
        aria-labelledby="recent-heading"
        className="mx-auto max-w-7xl px-5 py-16 sm:py-24"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#85591f]">
              Recently approved
            </p>
            <h2
              id="recent-heading"
              className="mt-2 font-serif text-3xl font-bold text-[#002147]"
            >
              Latest resources
            </h2>
          </div>
          <Link
            to="/resources?sort=recent"
            className="font-bold text-[#002147] underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        <div className="mt-8">
          {recent.isLoading ? (
            <LoadingState label="Loading recent resources" />
          ) : recent.isError ? (
            <ErrorState
              message="Recent resources could not be loaded."
              retry={() => void recent.refetch()}
            />
          ) : recent.data?.items.length === 0 ? (
            <EmptyState
              title="No published resources yet"
              message="Approved resources will appear here after moderation."
              action={
                <Link
                  to="/contribute"
                  className="font-bold text-[#002147] underline"
                >
                  Submit the first resource
                </Link>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recent.data?.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
                    {item.programName} · {item.termName}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-[#002147]">
                    <Link
                      to={`/resources/${item.slug}`}
                      className="rounded focus-visible:outline-2"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {item.description || "No description supplied."}
                  </p>
                  <p className="mt-5 text-xs text-slate-500">
                    {item.subjectName} · {item.downloadCount.toLocaleString()}{" "}
                    downloads
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
