import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import {
  fetchAcademicPostCategories,
  fetchAcademicPostPrograms,
  fetchFeaturedAcademicPost,
  fetchPublishedAcademicPosts,
} from "../../lib/supabase/academicPosts";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { AcademicPostCard } from "./AcademicPostCard";
import { AcademicPostFilters } from "./AcademicPostFilters";
import { FeaturedAcademicPost } from "./FeaturedAcademicPost";

export function AcademicPostsSection() {
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const posts = useQuery({
    queryKey: [
      "academic-posts",
      "faculties",
      debouncedSearch,
      programId,
      categoryId,
    ],
    queryFn: () =>
      fetchPublishedAcademicPosts({
        search: debouncedSearch,
        programId: programId || undefined,
        categoryId: categoryId || undefined,
        pageSize: 9,
      }),
  });
  const featured = useQuery({
    queryKey: ["academic-posts", "featured"],
    queryFn: fetchFeaturedAcademicPost,
  });
  const categories = useQuery({
    queryKey: ["academic-post-categories", "public"],
    queryFn: () => fetchAcademicPostCategories(false),
    staleTime: 10 * 60_000,
  });
  const programs = useQuery({
    queryKey: ["academic-post-programs"],
    queryFn: fetchAcademicPostPrograms,
    staleTime: 10 * 60_000,
  });

  const filtersActive = Boolean(debouncedSearch || programId || categoryId);
  const featuredPost = filtersActive
    ? (posts.data?.items[0] ?? null)
    : (featured.data ?? posts.data?.items[0] ?? null);
  const gridPosts = (posts.data?.items ?? []).filter(
    (post) => post.id !== featuredPost?.id,
  );

  return (
    <section
      id="academic-posts"
      aria-labelledby="academic-posts-heading"
      className="mt-20 border-t border-slate-200 pt-14 sm:mt-24 sm:pt-16"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#85591f]">
            Campus Resource Hub
          </p>
          <h2
            id="academic-posts-heading"
            className="mt-2 font-serif text-3xl font-bold text-[#002147] sm:text-4xl"
          >
            Latest Academic Posts
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Browse campus announcements, notes, question banks, Drive folders,
            project reports and important learning resources shared for Jana
            Bhawana Campus students.
          </p>
        </div>
        <Link
          to="/posts"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-[#d8b37a] bg-[#fffaf2] px-5 text-sm font-bold text-[#85591f] transition hover:bg-[#fff4df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#85591f]"
        >
          View all posts
        </Link>
      </div>

      <div className="mt-8">
        <AcademicPostFilters
          search={search}
          onSearchChange={setSearch}
          programId={programId}
          onProgramChange={setProgramId}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          programs={programs.data ?? []}
          categories={categories.data ?? []}
          resultCount={posts.data?.total}
        />
      </div>

      {posts.isLoading ||
      featured.isLoading ||
      categories.isLoading ||
      programs.isLoading ? (
        <LoadingState label="Loading academic posts" />
      ) : posts.isError ||
        featured.isError ||
        categories.isError ||
        programs.isError ? (
        <div className="mt-8">
          <ErrorState
            message="Academic posts could not be loaded."
            retry={() => {
              void posts.refetch();
              void featured.refetch();
              void categories.refetch();
              void programs.refetch();
            }}
          />
        </div>
      ) : featuredPost ? (
        <>
          <div className="mt-8">
            <FeaturedAcademicPost post={featuredPost} />
          </div>
          {gridPosts.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {gridPosts.map((post) => (
                <AcademicPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No matching academic posts"
            message="Try another search term or clear the selected filters."
            action={
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setProgramId("");
                  setCategoryId("");
                }}
                className="min-h-11 rounded-xl bg-[#002147] px-5 text-sm font-bold text-white"
              >
                Clear search and filters
              </button>
            }
          />
        </div>
      )}
    </section>
  );
}
