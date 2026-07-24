import { CalendarDays, Clock3, FolderOpen, UserRound } from "lucide-react";
import { AcademicPostActions } from "./AcademicPostActions";
import type { AcademicPost } from "./types";
import { formatAcademicPostDate } from "./utils";

export function FeaturedAcademicPost({ post }: { post: AcademicPost }) {
  const titleId = `featured-academic-post-${post.id}`;
  return (
    <article
      className="overflow-hidden rounded-2xl bg-[#001b3a] text-white shadow-[0_24px_60px_rgba(0,27,58,0.2)] lg:grid lg:grid-cols-5"
      aria-labelledby={titleId}
    >
      <div className="relative min-h-64 overflow-hidden lg:col-span-2 lg:min-h-[29rem]">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#d8b37a] via-[#85591f] to-[#002147]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001b3a]/85 via-[#001b3a]/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#001b3a]/60" />
        <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-[#001b3a]/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
          Featured post
        </span>
      </div>

      <div className="flex flex-col p-6 sm:p-9 lg:col-span-3 lg:p-10">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#d8b37a] px-3 py-1 text-xs font-bold text-[#001b3a]">
            {post.program?.code ?? post.program?.name ?? "General"}
          </span>
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold">
            {post.category.name}
          </span>
        </div>
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300">
          <CalendarDays aria-hidden="true" size={16} />
          {formatAcademicPostDate(post.publishedAt)}
        </p>
        <h3
          id={titleId}
          className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl"
        >
          {post.title}
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
          {post.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
          <span className="inline-flex items-center gap-2">
            <UserRound aria-hidden="true" size={16} />
            {post.authorName}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 aria-hidden="true" size={16} />
            {post.readingTimeMinutes} min read
          </span>
          {post.driveUrl && (
            <span className="inline-flex items-center gap-2 text-[#e9c994]">
              <FolderOpen aria-hidden="true" size={16} />
              {post.resourceCount} Drive{" "}
              {post.resourceCount === 1 ? "resource" : "resources"}
            </span>
          )}
        </div>
        <AcademicPostActions post={post} inverse />
      </div>
    </article>
  );
}
