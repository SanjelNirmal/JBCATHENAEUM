import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Eye,
  FolderOpen,
  Share2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/AsyncState";
import { JsonLd } from "../components/JsonLd";
import { Seo } from "../components/Seo";
import { AcademicPostCard } from "../features/academic-posts/AcademicPostCard";
import { MarkdownContent } from "../features/academic-posts/MarkdownContent";
import {
  formatAcademicPostDate,
  safeGoogleDriveUrl,
} from "../features/academic-posts/utils";
import {
  fetchAcademicPostBySlug,
  fetchRelatedAcademicPosts,
  incrementAcademicPostView,
  recordAcademicPostEvent,
} from "../lib/supabase/academicPosts";

export default function AcademicPostDetailPage() {
  const { slug = "" } = useParams();
  const [shareMessage, setShareMessage] = useState("");
  const post = useQuery({
    queryKey: ["academic-post", slug],
    queryFn: () => fetchAcademicPostBySlug(slug),
    enabled: Boolean(slug),
  });
  const related = useQuery({
    queryKey: ["academic-posts", "related", post.data?.id],
    queryFn: () => fetchRelatedAcademicPosts(post.data!, 3),
    enabled: Boolean(post.data),
  });

  useEffect(() => {
    if (!post.data) return;
    void incrementAcademicPostView(post.data.slug).catch(() => undefined);
  }, [post.data]);

  const share = async () => {
    if (!post.data) return;
    const url = window.location.href;
    try {
      if (navigator.share)
        await navigator.share({ title: post.data.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Link copied.");
      }
      void recordAcademicPostEvent(post.data.slug, "share").catch(
        () => undefined,
      );
    } catch {
      setShareMessage("Sharing was cancelled.");
    }
  };

  if (post.isLoading)
    return (
      <main id="main-content" className="flex-1 py-20">
        <LoadingState label="Loading academic post" />
      </main>
    );
  if (post.isError)
    return (
      <main id="main-content" className="flex-1 px-5 py-20">
        <ErrorState
          message="This academic post could not be loaded."
          retry={() => void post.refetch()}
        />
      </main>
    );
  if (!post.data)
    return (
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 text-center"
      >
        <Seo
          title="Post not found"
          description="The requested academic post is unavailable."
          path={`/posts/${slug}`}
          noIndex
        />
        <JsonLd
          id={`post-${item.id}`}
          data={[
            {
              "@context": "https://schema.org",
              "@type": ["Article", "NewsArticle"],
              headline: item.title,
              description: item.seoDescription || item.excerpt,
              datePublished: item.publishedAt,
              dateModified: item.updatedAt,
              author: { "@type": "Person", name: item.authorName },
              mainEntityOfPage: `https://jbc.nirmalsanjel.com.np/posts/${item.slug}`,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Academic Posts",
                  item: "https://jbc.nirmalsanjel.com.np/posts",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: item.title,
                  item: `https://jbc.nirmalsanjel.com.np/posts/${item.slug}`,
                },
              ],
            },
          ]}
        />
        <h1 className="font-serif text-4xl font-bold text-[#002147]">
          Post not found
        </h1>
        <p className="mt-4 text-slate-600">
          This post is unpublished, unavailable, or does not exist.
        </p>
        <Link
          to="/posts"
          className="mt-7 inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-5 font-bold text-white"
        >
          Browse published posts
        </Link>
      </main>
    );

  const item = post.data;
  const driveUrl = safeGoogleDriveUrl(item.driveUrl);
  return (
    <main id="main-content" className="flex-1">
      <Seo
        title={item.seoTitle || item.title}
        description={item.seoDescription || item.excerpt}
        path={`/posts/${item.slug}`}
        image={item.coverImageUrl ?? undefined}
        type="article"
        publishedAt={item.publishedAt ?? undefined}
        modifiedAt={item.updatedAt}
      />
      <article>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap gap-2 text-sm text-slate-500"
            >
              <Link to="/" className="hover:text-[#85591f]">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/posts" className="hover:text-[#85591f]">
                Academic Posts
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{item.title}</span>
            </nav>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#002147] px-3 py-1 text-xs font-bold text-white">
                {item.program?.code ?? item.program?.name ?? "General"}
              </span>
              <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-bold text-[#85591f]">
                {item.category.name}
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight text-[#002147] sm:text-6xl">
              {item.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              {item.excerpt}
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <UserRound size={16} aria-hidden="true" />
                {item.authorName}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} aria-hidden="true" />
                {formatAcademicPostDate(item.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 size={16} aria-hidden="true" />
                {item.readingTimeMinutes} min read
              </span>
              <span className="inline-flex items-center gap-2">
                <Eye size={16} aria-hidden="true" />
                {item.viewCount.toLocaleString()} views
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Last updated {formatAcademicPostDate(item.updatedAt)}
            </p>
          </div>
        </header>

        {item.coverImageUrl && (
          <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
            <img
              src={item.coverImageUrl}
              alt={`Cover image for ${item.title}`}
              loading="lazy"
              decoding="async"
              className="max-h-[34rem] w-full rounded-2xl object-cover shadow-xl"
            />
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <MarkdownContent body={item.body} />
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
            <h2 className="font-serif text-xl font-bold text-[#002147]">
              Post resources
            </h2>
            {driveUrl ? (
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void recordAcademicPostEvent(item.slug, "drive_open").catch(
                    () => undefined,
                  );
                }}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#002147] px-4 text-sm font-bold text-white"
              >
                <ExternalLink size={17} aria-hidden="true" />
                Open Google Drive
              </a>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                This post does not include a Drive resource.
              </p>
            )}
            {item.resourceCount > 0 && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
                <FolderOpen size={16} aria-hidden="true" />
                {item.resourceCount} resources
              </p>
            )}
            <button
              type="button"
              onClick={() => void share()}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-[#002147]"
            >
              <Share2 size={17} aria-hidden="true" />
              Share post
            </button>
            {shareMessage && (
              <p className="mt-2 text-xs text-slate-500" role="status">
                {shareMessage}
              </p>
            )}
          </aside>
        </div>
      </article>

      <section
        aria-labelledby="related-posts-heading"
        className="border-t border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <h2
            id="related-posts-heading"
            className="font-serif text-3xl font-bold text-[#002147]"
          >
            Related posts
          </h2>
          {related.isLoading ? (
            <LoadingState label="Loading related posts" />
          ) : related.isError ? (
            <ErrorState
              message="Related posts could not be loaded."
              retry={() => void related.refetch()}
            />
          ) : related.data?.length ? (
            <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.data.map((relatedPost) => (
                <AcademicPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No related posts are currently published.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
