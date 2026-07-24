import {
  CalendarDays,
  Clock3,
  ExternalLink,
  FolderOpen,
  UserRound,
} from "lucide-react";
import { MarkdownContent } from "./MarkdownContent";
import type { AcademicPost } from "./types";
import { formatAcademicPostDate } from "./utils";

export function AcademicPostPreview({ post }: { post: AcademicPost }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt=""
          className="max-h-[30rem] w-full object-cover"
        />
      )}
      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#002147] px-3 py-1 text-xs font-bold text-white">
            {post.program?.code ?? post.program?.name ?? "General"}
          </span>
          <span className="rounded-full bg-[#fff4df] px-3 py-1 text-xs font-bold text-[#85591f]">
            {post.category.name}
          </span>
        </div>
        <h1 className="mt-5 font-serif text-4xl font-bold leading-tight text-[#002147] sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap gap-5 border-y border-slate-200 py-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <UserRound size={16} aria-hidden="true" />
            {post.authorName}
          </span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} aria-hidden="true" />
            {formatAcademicPostDate(post.publishedAt ?? post.scheduledFor)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={16} aria-hidden="true" />
            {post.readingTimeMinutes} min read
          </span>
        </div>
        <div className="mt-8">
          <MarkdownContent body={post.body} />
        </div>
        {post.driveUrl && (
          <div className="mt-9 rounded-2xl bg-slate-50 p-5">
            <p className="inline-flex items-center gap-2 text-sm text-slate-600">
              <FolderOpen size={17} aria-hidden="true" />
              {post.resourceCount} resources
            </p>
            <a
              href={post.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002147] px-5 text-sm font-bold text-white"
            >
              <ExternalLink size={17} aria-hidden="true" />
              Open Google Drive
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
