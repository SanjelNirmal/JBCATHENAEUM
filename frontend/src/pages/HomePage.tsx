// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Download,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/AsyncState";
import { Hero } from "../components/Hero";
import { Seo } from "../components/Seo";
import {
  fetchPublicStats,
  searchResources,
} from "../lib/supabase/resources";

export default function HomePage() {
  const navigate = useNavigate();

  const recent = useQuery({
    queryKey: ["resources", "home"],
    queryFn: ({ signal }) =>
      searchResources(
        {
          q: "",
          sort: "recent",
          page: 1,
          pageSize: 5,
        },
        signal,
      ),
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

      {/* Advanced hero slider */}
<Hero
  onNavigateResources={() => navigate("/resources")}
onNavigateSemesters={() => navigate("/faculties")}
  onNavigateContribute={() => navigate("/contribute")}
/>


      {/* Platform statistics */}
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
                    <ItemIcon
                      className="text-[#85591f]"
                      aria-hidden="true"
                    />

                    <p className="mt-3 text-3xl font-black text-[#002147]">
                      {Number(value ?? 0).toLocaleString()}
                    </p>

                    <p className="text-sm text-slate-600">
                      {String(label)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Recently approved resources */}
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
                    {item.subjectName} ·{" "}
                    {item.downloadCount.toLocaleString()} downloads
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