import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import { AcademicPostPreview } from "../academic-posts/AcademicPostPreview";
import { AcademicPostStatusBadge } from "../academic-posts/AcademicPostStatusBadge";
import { fetchAcademicPostById } from "../../lib/supabase/academicPosts";

export default function AdminAcademicPostPreviewPage() {
  const { id = "" } = useParams();
  const post = useQuery({
    queryKey: ["admin-academic-post", id],
    queryFn: () => fetchAcademicPostById(id),
    enabled: Boolean(id),
  });
  if (post.isLoading)
    return (
      <main id="main-content">
        <LoadingState label="Loading post preview" />
      </main>
    );
  if (post.isError || !post.data)
    return (
      <main id="main-content">
        <ErrorState
          message="The academic post preview could not be loaded."
          retry={() => void post.refetch()}
        />
      </main>
    );
  return (
    <main id="main-content">
      <Seo
        title={`Preview: ${post.data.title}`}
        description="Private academic post preview."
        path={`/admin/posts/${post.data.id}/preview`}
        noIndex
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-[#002147]">
              Post preview
            </h1>
            <AcademicPostStatusBadge
              status={post.data.status}
              deleted={Boolean(post.data.deletedAt)}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            This private preview is available only to authorized post managers.
          </p>
        </div>
        <Link
          to={`/admin/posts/${post.data.id}/edit`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002147] px-4 font-bold text-white"
        >
          <Pencil size={17} aria-hidden="true" />
          Edit post
        </Link>
      </div>
      <AcademicPostPreview post={post.data} />
    </main>
  );
}
