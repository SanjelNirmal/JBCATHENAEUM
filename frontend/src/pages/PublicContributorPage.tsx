import { useQuery } from "@tanstack/react-query";
import { BookOpen, Star } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import {
  fetchPublicContributorProfile,
  searchResources,
} from "../lib/supabase/resources";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PublicContributorPage() {
  const { userId = "" } = useParams();
  const profile = useQuery({
    queryKey: ["public-contributor-profile", userId],
    queryFn: () => fetchPublicContributorProfile(userId),
    enabled: Boolean(userId),
  });
  const resources = useQuery({
    queryKey: ["public-contributor-resources", userId],
    queryFn: () =>
      searchResources({
        q: "",
        contributor: userId,
        sort: "recent",
        page: 1,
        pageSize: 12,
      }),
    enabled: Boolean(userId),
  });

  if (!userId) return <Navigate to="/resources" replace />;
  if (profile.isLoading)
    return (
      <main id="main-content">
        <LoadingState label="Loading contributor profile" />
      </main>
    );
  if (profile.isError)
    return (
      <main id="main-content" className="px-5 py-20">
        <ErrorState
          message="The contributor profile could not be loaded."
          retry={() => void profile.refetch()}
        />
      </main>
    );
  if (!profile.data)
    return (
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-20">
        <Seo
          title="Contributor not found"
          description="This contributor profile is unavailable."
          path={window.location.pathname}
          noIndex
        />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Contributor not found
        </h1>
        <p className="mt-4 text-slate-600">
          The profile may be private, inactive, or unavailable.
        </p>
        <Link
          to="/resources"
          className="mt-7 inline-flex rounded-xl bg-[#002147] px-6 py-3 font-bold text-white"
        >
          Return to resources
        </Link>
      </main>
    );

  const item = profile.data;
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <Seo
        title={`${item.name} | Contributor profile`}
        description={`Public contributor profile for ${item.name}, including Jana Bhawana Campus resources and public ratings.`}
        path={`/contributors/${item.id}`}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#002147] text-xl font-black text-white">
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={`${item.name} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(item.name) || "JB"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#85591f]">
                Contributor profile
              </p>
              <h1 className="mt-2 font-serif text-3xl font-bold text-[#002147]">
                {item.name}
              </h1>
              <p className="text-sm text-slate-600">{item.faculty}</p>
            </div>
          </div>
          {item.bio && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {item.bio}
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Resources" value={item.resourceCount} />
            <Stat label="Received" value={item.ratingCount} />
            <Stat
              label="Average"
              value={item.ratingCount ? item.averageRating.toFixed(1) : "—"}
            />
            <Stat
              label="Member since"
              value={new Date(item.createdAt).toLocaleDateString()}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Ratings received on this contributor&apos;s published resources.
          </p>
        </aside>

        <section>
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-[#002147]">
              Published resources
            </h2>
            <p className="mt-3 text-slate-600">
              Public resources published by this contributor.
            </p>
          </div>
          {resources.isLoading ? (
            <LoadingState label="Loading contributor resources" />
          ) : resources.isError ? (
            <ErrorState
              message="Contributor resources could not be loaded."
              retry={() => void resources.refetch()}
            />
          ) : !resources.data?.items.length ? (
            <EmptyState
              title="No published resources"
              message="This contributor has no public resources yet."
            />
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resources.data.items.map((resource) => (
                <Link
                  key={resource.id}
                  to={`/resources/${resource.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#002147]/40 hover:shadow-lg"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#85591f]">
                    {resource.subjectName}
                  </p>
                  <h3 className="mt-3 font-serif text-xl font-bold text-[#002147]">
                    {resource.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                    {resource.description || "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>{resource.termName}</span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={14} />
                      {resource.downloadCount.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1 text-lg font-bold text-[#002147]">
        {label === "Average" && <Star size={15} className="text-[#b7791f]" />}
        <span>{value}</span>
      </p>
    </div>
  );
}
