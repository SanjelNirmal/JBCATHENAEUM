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
import { AcademicTrustSection } from "../components/AcademicTrustSection";
import { JsonLd } from "../components/JsonLd";
import { Seo } from "../components/Seo";
import { HomeAcademicPostsSection } from "../features/academic-posts/HomeAcademicPostsSection";
import {
  fetchHomepageDiscovery,
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
 const discovery = useQuery({
   queryKey: ["homepage-discovery"],
   queryFn: () => fetchHomepageDiscovery(4),
 });

 return (
   <main id="main-content">
     <Seo
       title="TU BCA, BICTE, BBS and MBS Notes | JBC Athenaeum"
       description="Browse reviewed TU BCA, BICTE, BBS and MBS notes, past questions, project reports and practical resources for Jana Bhawana Campus students."
       path="/"
       image="/jana-bhawana-campus.jpg"
       keywords="TU BCA notes, BICTE notes, BBS notes, MBS notes, Jana Bhawana Campus resources"
     />
     <JsonLd
       id="homepage-website"
       data={[
         {
           "@context": "https://schema.org",
           "@type": "WebSite",
           name: "JBC Athenaeum",
           url: "https://jbc.nirmalsanjel.com.np/",
           potentialAction: {
             "@type": "SearchAction",
             target:
               "https://jbc.nirmalsanjel.com.np/resources?q={search_term_string}",
             "query-input": "required name=search_term_string",
           },
         },
         {
           "@context": "https://schema.org",
           "@type": "EducationalOrganization",
           name: "JBC Athenaeum",
           description:
             "Student-built academic archive for Jana Bhawana Campus students.",
           url: "https://jbc.nirmalsanjel.com.np/",
         },
       ]}
     />

     {/* Advanced hero slider */}
     <Hero
       onNavigateResources={() => navigate("/resources")}
       onNavigateSemesters={() => navigate("/faculties")}
       onNavigateContribute={() => navigate("/contribute")}
     />
     <section className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
       <h1 className="font-serif text-3xl font-bold text-[#002147] sm:text-5xl">
         Study smarter with reviewed TU notes and resources
       </h1>
       <p className="mt-3 text-base leading-8 text-slate-700">
         Browse reviewed notes, past questions, project reports, practical
         files and academic resources for Jana Bhawana Campus students.
       </p>
       <p className="mt-2 text-sm font-semibold text-slate-600">
         TU BCA, BICTE, BBS and MBS Notes and Resources for Jana Bhawana Campus
       </p>
     </section>


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

      <section
        aria-labelledby="popular-discovery-heading"
        className="mx-auto max-w-7xl px-5 pb-16 sm:pb-20"
      >
        <h2
          id="popular-discovery-heading"
          className="font-serif text-3xl font-bold text-[#002147]"
        >
          Most downloaded this week
        </h2>
        {discovery.isLoading ? (
          <LoadingState label="Loading popular resources" />
        ) : discovery.isError ? (
          <ErrorState
            message="Popular resources are unavailable right now."
            retry={() => void discovery.refetch()}
          />
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {discovery.data?.mostDownloaded.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
                  {item.programName} · {item.termName}
                </p>
                <h3 className="mt-3 text-base font-bold text-[#002147]">
                  <Link to={`/resources/${item.slug}`}>{item.title}</Link>
                </h3>
                <p className="mt-3 text-xs text-slate-600">
                  {item.subjectName} · {item.weeklyDownloads.toLocaleString()}{" "}
                  downloads this week
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:pb-20">
        <h2 className="font-serif text-3xl font-bold text-[#002147]">
          Top rated resources
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {discovery.data?.topRated.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-[#85591f]">
                {item.programName} · {item.termName}
              </p>
              <h3 className="mt-3 text-base font-bold text-[#002147]">
                <Link to={`/resources/${item.slug}`}>{item.title}</Link>
              </h3>
              <p className="mt-3 text-xs text-slate-600">
                {item.averageRating.toFixed(1)} average from{" "}
                {item.ratingCount.toLocaleString()} ratings
              </p>
            </article>
          ))}
        </div>
      </section>

      <HomeAcademicPostsSection />
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:pb-24">
        <AcademicTrustSection />
      </section>
    </main>
  );
}
