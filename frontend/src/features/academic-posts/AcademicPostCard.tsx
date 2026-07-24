import { CalendarDays, Clock3, FolderOpen, UserRound } from "lucide-react";
import { AcademicPostActions } from "./AcademicPostActions";
import type { AcademicPost } from "./types";
import { formatAcademicPostDate } from "./utils";

export function AcademicPostCard({ post }: { post: AcademicPost }) {
  const titleId = `academic-post-${post.id}`;
  return (
    <article
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d8b37a] hover:shadow-xl"
      aria-labelledby={titleId}
    >
      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt=""
          loading="lazy"
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
      )}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#002147] px-2.5 py-1 text-[11px] font-bold text-white">
            {post.program?.code ?? post.program?.name ?? "General"}
          </span>
          <span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[11px] font-bold text-[#85591f]">
            {post.category.name}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays aria-hidden="true" size={14} />
            {formatAcademicPostDate(post.publishedAt)}
          </span>
        </div>
        <h3
          id={titleId}
          className="mt-4 font-serif text-2xl font-bold leading-snug text-[#002147]"
        >
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {post.excerpt}
        </p>
        <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <UserRound aria-hidden="true" size={14} />
            {post.authorName}
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden="true" size={14} />
              {post.readingTimeMinutes} min read
            </span>
            {post.driveUrl && (
              <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                <FolderOpen aria-hidden="true" size={14} />
                Google Drive
              </span>
            )}
            {post.resourceCount > 0 && (
              <span>{post.resourceCount} resources</span>
            )}
            <span>{post.viewCount.toLocaleString()} views</span>
          </div>
        </div>
        <AcademicPostActions post={post} />
      </div>
    </article>
  );
}
