import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import {
  fetchFeaturedAcademicPost,
  fetchPublishedAcademicPosts,
} from "../../lib/supabase/academicPosts";
import { AcademicPostCard } from "./AcademicPostCard";
import { FeaturedAcademicPost } from "./FeaturedAcademicPost";

export function HomeAcademicPostsSection() {
  const latest = useQuery({
    queryKey: ["academic-posts", "home", "latest"],
    queryFn: () =>
      fetchPublishedAcademicPosts({
        page: 1,
        pageSize: 4,
        sort: "newest",
      }),
  });
  const featured = useQuery({
    queryKey: ["academic-posts", "featured"],
    queryFn: fetchFeaturedAcademicPost,
  });

  const featuredPost = featured.data ?? latest.data?.items[0] ?? null;
  const latestPosts = (latest.data?.items ?? [])
    .filter((post) => post.id !== featuredPost?.id)
    .slice(0, 3);

  return (
    <section
      aria-labelledby="home-academic-posts-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:py-24">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-widest text-[#85591f]">
              Campus Resource Hub
            </p>
            <h2
              id="home-academic-posts-heading"
              className="mt-2 font-serif text-3xl font-bold text-[#002147] sm:text-4xl"
            >
              Featured &amp; latest academic posts
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Read campus notices, academic guidance, notes, project updates,
              and curated learning resources published by JBC Athenaeum.
            </p>
          </div>

          <Link
            to="/posts"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-xl border border-[#d8b37a] bg-[#fffaf2] px-5 text-sm font-bold text-[#85591f] transition hover:bg-[#fff4df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#85591f] sm:self-auto"
          >
            View all posts
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        {latest.isLoading || featured.isLoading ? (
          <div className="mt-8">
            <LoadingState label="Loading featured academic posts" />
          </div>
        ) : latest.isError || featured.isError ? (
          <div className="mt-8">
            <ErrorState
              message="Academic posts are temporarily unavailable."
              retry={() => {
                void latest.refetch();
                void featured.refetch();
              }}
            />
          </div>
        ) : featuredPost ? (
          <>
            <div className="mt-8">
              <FeaturedAcademicPost post={featuredPost} />
            </div>

            {latestPosts.length > 0 && (
              <div
                className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                aria-label="Latest academic posts"
              >
                {latestPosts.map((post) => (
                  <AcademicPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-8">
            <EmptyState
              title="No academic posts published yet"
              message="Featured posts and campus updates will appear here after publication."
              action={
                <Link
                  to="/posts"
                  className="font-bold text-[#002147] underline underline-offset-4"
                >
                  Browse the post archive
                </Link>
              }
            />
          </div>
        )}
      </div>
    </section>
  );
}
