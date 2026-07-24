import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import { ErrorState, LoadingState } from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import {
  AcademicPostForm,
  type AcademicPostFormSubmission,
} from "../academic-posts/AcademicPostForm";
import {
  createAcademicPost,
  deleteAcademicPostCover,
  deleteAcademicPostCoverFile,
  fetchAcademicPostById,
  fetchAcademicPostCategories,
  fetchAcademicPostPrograms,
  updateAcademicPost,
  uploadAcademicPostCover,
} from "../../lib/supabase/academicPosts";
import { toSafeErrorMessage } from "../../lib/supabase/errors";

export default function AcademicPostEditorPage({
  mode,
}: {
  mode: "create" | "edit";
}) {
  const { id = "" } = useParams();
  const auth = useCurrentAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const post = useQuery({
    queryKey: ["admin-academic-post", id],
    queryFn: () => fetchAcademicPostById(id),
    enabled: mode === "edit" && Boolean(id),
  });
  const categories = useQuery({
    queryKey: ["academic-post-categories", "admin"],
    queryFn: () => fetchAcademicPostCategories(true),
  });
  const programs = useQuery({
    queryKey: ["academic-post-programs"],
    queryFn: fetchAcademicPostPrograms,
  });

  const save = async (submission: AcademicPostFormSubmission) => {
    if (!auth.user) return;
    setBusy(true);
    setPageError("");
    let targetId = id;
    try {
      if (mode === "create") {
        targetId = await createAcademicPost(submission.input, auth.user.id);
      } else {
        await updateAcademicPost(id, submission.input);
      }
      const oldCoverPath = post.data?.coverImagePath ?? null;
      if (submission.removeCover && oldCoverPath) {
        setUploadMessage("Removing the previous cover image…");
        await deleteAcademicPostCover(targetId, oldCoverPath);
      }
      if (submission.coverFile) {
        setUploadMessage("Uploading and securing the cover image…");
        await uploadAcademicPostCover(targetId, submission.coverFile);
        if (oldCoverPath)
          await deleteAcademicPostCoverFile(oldCoverPath).catch(
            () => undefined,
          );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-academic-posts"] }),
        queryClient.invalidateQueries({ queryKey: ["academic-posts"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin-academic-post-stats"],
        }),
      ]);
      navigate(`/admin/posts/${targetId}/edit`, {
        replace: mode === "create",
        state: { message: "Academic post saved successfully." },
      });
    } catch (error) {
      setPageError(toSafeErrorMessage(error));
      throw error;
    } finally {
      setBusy(false);
      setUploadMessage("");
    }
  };

  if (
    categories.isLoading ||
    programs.isLoading ||
    (mode === "edit" && post.isLoading)
  )
    return (
      <main id="main-content">
        <LoadingState label="Loading academic post editor" />
      </main>
    );
  if (
    categories.isError ||
    programs.isError ||
    (mode === "edit" && post.isError)
  )
    return (
      <main id="main-content">
        <ErrorState
          message="The academic post editor could not be loaded."
          retry={() => {
            void categories.refetch();
            void programs.refetch();
            if (mode === "edit") void post.refetch();
          }}
        />
      </main>
    );
  if (mode === "edit" && !post.data)
    return (
      <main id="main-content">
        <ErrorState message="The requested academic post was not found." />
      </main>
    );

  return (
    <main id="main-content">
      <Seo
        title={
          mode === "create" ? "Create academic post" : "Edit academic post"
        }
        description="Manage an academic post."
        path={
          mode === "create" ? "/admin/posts/new" : `/admin/posts/${id}/edit`
        }
        noIndex
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#002147]">
            {mode === "create" ? "Create academic post" : "Edit academic post"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Write safe Markdown, attach optional Drive resources, and control
            publication from one editor.
          </p>
        </div>
        {post.data && (
          <Link
            to={`/admin/posts/${post.data.id}/preview`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-bold"
          >
            <Eye size={17} aria-hidden="true" />
            Preview
          </Link>
        )}
      </div>
      {pageError && (
        <p
          className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {pageError}
        </p>
      )}
      <AcademicPostForm
        post={post.data ?? undefined}
        programs={programs.data ?? []}
        categories={(categories.data ?? []).filter(
          (category) =>
            category.isActive || category.id === post.data?.category.id,
        )}
        authorName={auth.profile?.name ?? "JBC Athenaeum"}
        busy={busy}
        uploadMessage={uploadMessage}
        onSubmit={save}
        onCancel={() => navigate("/admin/posts")}
      />
    </main>
  );
}
