import { BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { recordAcademicPostEvent } from "../../lib/supabase/academicPosts";
import type { AcademicPost } from "./types";
import { safeGoogleDriveUrl } from "./utils";

export function AcademicPostActions({
  post,
  inverse = false,
}: {
  post: AcademicPost;
  inverse?: boolean;
}) {
  const driveUrl = safeGoogleDriveUrl(post.driveUrl);
  return (
    <div className="mt-auto flex flex-wrap gap-3 pt-5">
      <Link
        to={`/posts/${post.slug}`}
        aria-label={`Read ${post.title}`}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b37a] ${
          inverse
            ? "bg-[#d8b37a] text-[#001b3a] hover:bg-[#e2bf88]"
            : "bg-[#002147] text-white hover:bg-[#12345a]"
        }`}
      >
        <BookOpen aria-hidden="true" size={17} />
        Read Post
      </Link>
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void recordAcademicPostEvent(post.slug, "drive_open").catch(
              () => undefined,
            );
          }}
          aria-label={`Open Google Drive resources for ${post.title}`}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d8b37a] ${
            inverse
              ? "border-white/35 bg-white/10 text-white hover:border-[#d8b37a] hover:bg-white/15"
              : "border-slate-300 bg-white text-[#002147] hover:border-[#85591f] hover:bg-[#fffaf2]"
          }`}
        >
          <ExternalLink aria-hidden="true" size={17} />
          Open Drive
        </a>
      )}
    </div>
  );
}
