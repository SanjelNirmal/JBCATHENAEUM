import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { Seo } from "../components/Seo";
import { AcademicPostCard } from "../features/academic-posts/AcademicPostCard";
import { AcademicPostFilters } from "../features/academic-posts/AcademicPostFilters";
import {
  fetchAcademicPostCategories,
  fetchAcademicPostPrograms,
  fetchPublishedAcademicPosts,
} from "../lib/supabase/academicPosts";
import { useDebouncedValue } from "../lib/useDebouncedValue";

export default function AcademicPostsPage() {
  const [search, setSearch] = useState("");
  const [programId, setProgramId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  useEffect(() => setPage(1), [debouncedSearch, programId, categoryId, sort]);

  const posts = useQuery({
    queryKey: [
      "academic-posts",
      "archive",
      debouncedSearch,
      programId,
      categoryId,
      sort,
      page,
    ],
    queryFn: () =>
      fetchPublishedAcademicPosts({
        search: debouncedSearch,
        programId: programId || undefined,
        categoryId: categoryId || undefined,
        sort,
        page,
        pageSize: 12,
      }),
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
  const pages = Math.max(1, Math.ceil((posts.data?.total ?? 0) / 12));

  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16"
    >
      <Seo
        title="Academic Posts"
        description="Browse academic notes, campus notices, news, projects, past questions, and Google Drive resources from Jana Bhawana Campus."
        path="/posts"
      />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#85591f]">
        Campus Resource Hub
      </p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl font-bold text-[#002147] sm:text-5xl">
            Academic Posts
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Explore published learning resources, campus news, notices, and
            academic updates.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-600" aria-live="polite">
          {posts.data?.total ?? 0} published posts
        </p>
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
      <div className="mt-5 flex justify-end">
        <label className="text-sm font-semibold text-slate-700">
          Sort posts
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "newest" | "oldest")
            }
            className="ml-3 min-h-11 rounded-xl border border-slate-300 bg-white px-3"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>

      <div className="mt-8">
        {posts.isLoading || categories.isLoading || programs.isLoading ? (
          <LoadingState label="Loading academic posts" />
        ) : posts.isError || categories.isError || programs.isError ? (
          <ErrorState
            message="Academic posts could not be loaded."
            retry={() => {
              void posts.refetch();
              void categories.refetch();
              void programs.refetch();
            }}
          />
        ) : posts.data?.items.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.data.items.map((post) => (
              <AcademicPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No published posts found"
            message="Try a different search term or filter."
          />
        )}
      </div>

      {pages > 1 && (
        <nav
          aria-label="Academic posts pagination"
          className="mt-10 flex items-center justify-center gap-3"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 font-bold disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
