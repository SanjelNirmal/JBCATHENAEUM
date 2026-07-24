import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Eye,
  FilePlus2,
  Pencil,
  RotateCcw,
  Send,
  Star,
  StarOff,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCurrentAuth } from "../../app/AuthContext";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/AsyncState";
import { Seo } from "../../components/Seo";
import { AcademicPostStatusBadge } from "../academic-posts/AcademicPostStatusBadge";
import type { AcademicPostStatus } from "../academic-posts/types";
import {
  archiveAcademicPost,
  deleteAcademicPost,
  fetchAcademicPostCategories,
  fetchAcademicPostPrograms,
  fetchAdminAcademicPosts,
  fetchAdminAcademicPostStats,
  publishAcademicPost,
  restoreAcademicPost,
  restoreDeletedAcademicPost,
  setFeaturedAcademicPost,
  unpublishAcademicPost,
} from "../../lib/supabase/academicPosts";
import { toSafeErrorMessage } from "../../lib/supabase/errors";
import { useDebouncedValue } from "../../lib/useDebouncedValue";

type StatusFilter = AcademicPostStatus | "deleted" | "";

export default function AdminAcademicPostsPage() {
  const auth = useCurrentAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [programId, setProgramId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [featured, setFeatured] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const debouncedAuthor = useDebouncedValue(authorName);
  useEffect(
    () => setPage(1),
    [
      debouncedAuthor,
      debouncedSearch,
      status,
      programId,
      categoryId,
      featured,
      dateFrom,
      dateTo,
    ],
  );

  const posts = useQuery({
    queryKey: [
      "admin-academic-posts",
      page,
      debouncedSearch,
      status,
      programId,
      categoryId,
      debouncedAuthor,
      featured,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchAdminAcademicPosts({
        page,
        pageSize: 20,
        search: debouncedSearch,
        status: status || undefined,
        programId: programId || undefined,
        categoryId: categoryId || undefined,
        authorName: debouncedAuthor || undefined,
        featured: featured === "" ? undefined : featured === "featured",
        dateFrom: dateFrom
          ? new Date(`${dateFrom}T00:00:00`).toISOString()
          : undefined,
        dateTo: dateTo
          ? new Date(
              new Date(`${dateTo}T00:00:00`).getTime() + 86_400_000,
            ).toISOString()
          : undefined,
      }),
  });
  const stats = useQuery({
    queryKey: ["admin-academic-post-stats"],
    queryFn: fetchAdminAcademicPostStats,
  });
  const categories = useQuery({
    queryKey: ["academic-post-categories", "admin"],
    queryFn: () => fetchAcademicPostCategories(true),
  });
  const programs = useQuery({
    queryKey: ["academic-post-programs"],
    queryFn: fetchAcademicPostPrograms,
  });
  const pages = Math.max(1, Math.ceil((posts.data?.total ?? 0) / 20));

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-academic-posts"] }),
      queryClient.invalidateQueries({
        queryKey: ["admin-academic-post-stats"],
      }),
      queryClient.invalidateQueries({ queryKey: ["academic-posts"] }),
    ]);
  };

  const run = async (
    id: string,
    label: string,
    action: () => Promise<void>,
    confirmMessage?: string,
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setBusyId(id);
    setMessage("");
    try {
      await action();
      setMessage(label);
      await refresh();
    } catch (error) {
      setMessage(toSafeErrorMessage(error));
    } finally {
      setBusyId("");
    }
  };

  const summary = [
    ["Total posts", stats.data?.total ?? 0],
    ["Published", stats.data?.published ?? 0],
    ["Drafts", stats.data?.drafts ?? 0],
    ["Scheduled", stats.data?.scheduled ?? 0],
    ["Archived", stats.data?.archived ?? 0],
    ["Featured", stats.data?.featured ?? 0],
  ] as const;

  return (
    <main id="main-content">
      <Seo
        title="Academic post management"
        description="Manage academic posts, news, notices, and Drive resources."
        path="/admin/posts"
        noIndex
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#002147]">
            Academic posts
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Create, schedule, publish, feature, archive, and audit campus posts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/post-categories"
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 font-bold"
          >
            Manage categories
          </Link>
          <Link
            to="/admin/posts/new"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002147] px-4 font-bold text-white"
          >
            <FilePlus2 size={18} aria-hidden="true" />
            New post
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {summary.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p className="mt-2 font-serif text-3xl font-bold text-[#002147]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-semibold">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Title, excerpt, or body"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
            {auth.profile?.role === "super_admin" && (
              <option value="deleted">Deleted</option>
            )}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Program
          <select
            value={programId}
            onChange={(event) => setProgramId(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All programs</option>
            {(programs.data ?? []).map((program) => (
              <option key={program.id} value={program.id}>
                {program.code ?? program.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All categories</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Author
          <input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="Author name"
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Featured
          <select
            value={featured}
            onChange={(event) => setFeatured(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          >
            <option value="">All posts</option>
            <option value="featured">Featured only</option>
            <option value="not-featured">Not featured</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Created from
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
        <label className="text-sm font-semibold">
          Created to
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
          />
        </label>
      </div>

      {message && (
        <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm" role="status">
          {message}
        </p>
      )}

      <div className="mt-6">
        {posts.isLoading ? (
          <LoadingState label="Loading academic posts" />
        ) : posts.isError ? (
          <ErrorState
            message="Academic posts could not be loaded."
            retry={() => void posts.refetch()}
          />
        ) : posts.data?.items.length ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[78rem] text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Post",
                    "Program",
                    "Category",
                    "Status",
                    "Featured",
                    "Author",
                    "Publication",
                    "Views",
                    "Updated",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} scope="col" className="p-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.data.items.map((post) => {
                  const busy = busyId === post.id;
                  return (
                    <tr key={post.id} className="border-t border-slate-100">
                      <td className="p-3">
                        <div className="flex w-72 items-center gap-3">
                          {post.coverImageUrl ? (
                            <img
                              src={post.coverImageUrl}
                              alt=""
                              loading="lazy"
                              className="h-12 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-lg bg-slate-100" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#002147]">
                              {post.title}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              /{post.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {post.program?.code ?? post.program?.name ?? "General"}
                      </td>
                      <td className="p-3">{post.category.name}</td>
                      <td className="p-3">
                        <AcademicPostStatusBadge
                          status={post.status}
                          deleted={Boolean(post.deletedAt)}
                        />
                      </td>
                      <td className="p-3">
                        {post.isFeatured ? "Primary" : "—"}
                      </td>
                      <td className="p-3">{post.authorName}</td>
                      <td className="p-3">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : post.scheduledFor
                            ? `Scheduled ${new Date(post.scheduledFor).toLocaleString()}`
                            : "—"}
                      </td>
                      <td className="p-3">{post.viewCount.toLocaleString()}</td>
                      <td className="p-3">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex w-72 flex-wrap gap-2">
                          {!post.deletedAt && (
                            <>
                              <Link
                                to={`/admin/posts/${post.id}/edit`}
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-2.5 font-bold"
                              >
                                <Pencil size={14} aria-hidden="true" />
                                Edit
                              </Link>
                              <Link
                                to={`/admin/posts/${post.id}/preview`}
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 px-2.5 font-bold"
                              >
                                <Eye size={14} aria-hidden="true" />
                                Preview
                              </Link>
                              {post.status === "published" ? (
                                <ActionButton
                                  label="Unpublish"
                                  icon={Undo2}
                                  disabled={busy}
                                  onClick={() =>
                                    void run(post.id, "Post unpublished.", () =>
                                      unpublishAcademicPost(post.id),
                                    )
                                  }
                                />
                              ) : post.status !== "archived" ? (
                                <ActionButton
                                  label="Publish"
                                  icon={Send}
                                  disabled={busy}
                                  onClick={() =>
                                    void run(post.id, "Post published.", () =>
                                      publishAcademicPost(post.id),
                                    )
                                  }
                                />
                              ) : null}
                              {(post.status === "published" ||
                                post.status === "scheduled") && (
                                <ActionButton
                                  label={
                                    post.isFeatured ? "Unfeature" : "Feature"
                                  }
                                  icon={post.isFeatured ? StarOff : Star}
                                  disabled={busy}
                                  onClick={() =>
                                    void run(
                                      post.id,
                                      post.isFeatured
                                        ? "Post unfeatured."
                                        : "Post featured.",
                                      () =>
                                        setFeaturedAcademicPost(
                                          post.id,
                                          !post.isFeatured,
                                        ),
                                    )
                                  }
                                />
                              )}
                              {post.status === "archived" ? (
                                <ActionButton
                                  label="Restore"
                                  icon={RotateCcw}
                                  disabled={busy}
                                  onClick={() =>
                                    void run(
                                      post.id,
                                      "Post restored as a draft.",
                                      () => restoreAcademicPost(post.id),
                                    )
                                  }
                                />
                              ) : (
                                <ActionButton
                                  label="Archive"
                                  icon={Archive}
                                  disabled={busy}
                                  onClick={() =>
                                    void run(
                                      post.id,
                                      "Post archived.",
                                      () => archiveAcademicPost(post.id),
                                      `Archive “${post.title}”?`,
                                    )
                                  }
                                />
                              )}
                            </>
                          )}
                          {auth.profile?.role === "super_admin" &&
                            (post.deletedAt ? (
                              <ActionButton
                                label="Restore deleted"
                                icon={RotateCcw}
                                disabled={busy}
                                onClick={() =>
                                  void run(
                                    post.id,
                                    "Deleted post restored.",
                                    () => restoreDeletedAcademicPost(post.id),
                                  )
                                }
                              />
                            ) : (
                              <ActionButton
                                label="Delete"
                                icon={Trash2}
                                disabled={busy}
                                danger
                                onClick={() =>
                                  void run(
                                    post.id,
                                    "Post soft-deleted.",
                                    () => deleteAcademicPost(post.id),
                                    `Soft-delete “${post.title}”? It will disappear from normal management views.`,
                                  )
                                }
                              />
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No academic posts found"
            message="Create the first post or adjust the current filters."
            action={
              <Link
                to="/admin/posts/new"
                className="inline-flex min-h-11 items-center rounded-xl bg-[#002147] px-5 font-bold text-white"
              >
                Create academic post
              </Link>
            }
          />
        )}
      </div>

      {pages > 1 && (
        <nav
          aria-label="Admin academic posts pagination"
          className="mt-7 flex justify-center gap-3"
        >
          <button
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="self-center text-sm">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((value) => Math.min(pages, value + 1))}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  danger = false,
}: {
  label: string;
  icon: typeof Send;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1 rounded-lg border px-2.5 font-bold disabled:opacity-40 ${
        danger
          ? "border-red-300 text-red-700"
          : "border-slate-300 text-slate-700"
      }`}
    >
      <Icon size={14} aria-hidden="true" />
      {label}
    </button>
  );
}
