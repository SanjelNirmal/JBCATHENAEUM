import { ImagePlus, Save, Send, Timer, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";
import { z } from "zod";
import {
  isAcademicPostSlugAvailable,
  slugifyAcademicPost,
  validateAcademicPostCover,
  validateAcademicPostDriveUrl,
} from "../../lib/supabase/academicPosts";
import type {
  AcademicPost,
  AcademicPostCategory,
  AcademicPostInput,
  AcademicPostProgram,
  AcademicPostStatus,
} from "./types";

export interface AcademicPostFormSubmission {
  input: AcademicPostInput;
  coverFile: File | null;
  removeCover: boolean;
}

const formSchema = z.object({
  title: z.string().trim().min(2).max(240),
  slug: z.string().trim().min(2).max(180),
  excerpt: z.string().trim().min(2).max(300),
  body: z.string().trim().min(2),
  categoryId: z.string().uuid(),
  authorName: z.string().trim().min(2).max(160),
  resourceCount: z.number().int().min(0),
  readingTimeMinutes: z.number().int().min(1).max(600),
  seoTitle: z.string().trim().max(240),
  seoDescription: z.string().trim().max(300),
});

export function AcademicPostForm({
  post,
  programs,
  categories,
  authorName,
  busy,
  uploadMessage,
  onSubmit,
  onCancel,
}: {
  post?: AcademicPost;
  programs: AcademicPostProgram[];
  categories: AcademicPostCategory[];
  authorName: string;
  busy: boolean;
  uploadMessage?: string;
  onSubmit: (submission: AcademicPostFormSubmission) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [programId, setProgramId] = useState(post?.program?.id ?? "");
  const [categoryId, setCategoryId] = useState(post?.category.id ?? "");
  const [driveUrl, setDriveUrl] = useState(post?.driveUrl ?? "");
  const [resourceCount, setResourceCount] = useState(post?.resourceCount ?? 0);
  const [readingTime, setReadingTime] = useState(post?.readingTimeMinutes ?? 1);
  const [featured, setFeatured] = useState(post?.isFeatured ?? false);
  const [scheduledFor, setScheduledFor] = useState(
    post?.scheduledFor ? post.scheduledFor.slice(0, 16) : "",
  );
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seoDescription ?? "",
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const initialRender = useRef(true);

  useEffect(() => {
    if (!slugEdited) setSlug(slugifyAcademicPost(title));
  }, [slugEdited, title]);
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    setDirty(true);
  }, [
    body,
    categoryId,
    coverFile,
    driveUrl,
    excerpt,
    featured,
    programId,
    readingTime,
    removeCover,
    resourceCount,
    scheduledFor,
    seoDescription,
    seoTitle,
    slug,
    title,
  ]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty || busy) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy, dirty]);
  const blocker = useBlocker(dirty && !busy);
  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  );
  useEffect(
    () => () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    },
    [coverPreview],
  );

  const submit = async (status: AcademicPostStatus) => {
    setError("");
    try {
      const parsed = formSchema.parse({
        title,
        slug: slugifyAcademicPost(slug),
        excerpt,
        body,
        categoryId,
        authorName: post?.authorName || authorName,
        resourceCount,
        readingTimeMinutes: readingTime,
        seoTitle,
        seoDescription,
      });
      if (!(await isAcademicPostSlugAvailable(parsed.slug, post?.id)))
        throw new Error("Another academic post already uses this slug.");
      const normalizedDrive = validateAcademicPostDriveUrl(driveUrl);
      if (coverFile) validateAcademicPostCover(coverFile);
      if (status === "scheduled") {
        if (!scheduledFor)
          throw new Error("Choose a scheduled publication date and time.");
        if (new Date(scheduledFor).getTime() <= Date.now())
          throw new Error("Scheduled publication must be in the future.");
      }
      await onSubmit({
        input: {
          title: parsed.title,
          slug: parsed.slug,
          excerpt: parsed.excerpt,
          body: parsed.body,
          programId: programId || null,
          categoryId: parsed.categoryId,
          authorName: parsed.authorName,
          driveUrl: normalizedDrive,
          resourceCount: parsed.resourceCount,
          readingTimeMinutes: parsed.readingTimeMinutes,
          status,
          isFeatured: featured && status !== "draft",
          publishedAt:
            status === "published"
              ? post?.publishedAt || new Date().toISOString()
              : null,
          scheduledFor:
            status === "scheduled"
              ? new Date(scheduledFor).toISOString()
              : null,
          seoTitle: parsed.seoTitle || null,
          seoDescription: parsed.seoDescription || null,
        },
        coverFile,
        removeCover,
      });
      setDirty(false);
    } catch (submissionError) {
      if (submissionError instanceof z.ZodError)
        setError(
          submissionError.issues[0]?.message ??
            "Review the highlighted post fields.",
        );
      else
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "The post could not be saved.",
        );
    }
  };

  return (
    <>
      {blocker.state === "blocked" && (
        <div
          className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4"
          role="alert"
        >
          <p className="font-bold text-amber-900">Unsaved changes</p>
          <p className="mt-1 text-sm text-amber-800">
            Leave this page and discard your changes?
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => blocker.proceed()}
              className="min-h-10 rounded-lg bg-amber-800 px-4 text-sm font-bold text-white"
            >
              Discard changes
            </button>
            <button
              type="button"
              onClick={() => blocker.reset()}
              className="min-h-10 rounded-lg border border-amber-400 px-4 text-sm font-bold"
            >
              Keep editing
            </button>
          </div>
        </div>
      )}
      <form
        onSubmit={(event) => event.preventDefault()}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {uploadMessage && (
          <div className="rounded-xl bg-blue-50 p-4" role="status">
            <p className="text-sm font-semibold text-blue-900">
              {uploadMessage}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-blue-700" />
            </div>
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Title
            <input
              required
              maxLength={240}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            />
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Slug
            <input
              required
              maxLength={180}
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugifyAcademicPost(event.target.value));
              }}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-mono text-sm"
            />
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Excerpt
            <textarea
              required
              maxLength={300}
              rows={3}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            />
            <span className="mt-1 block text-right text-xs text-slate-500">
              {excerpt.length}/300
            </span>
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Post body (Markdown)
            <textarea
              required
              rows={16}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-mono text-sm leading-6"
              placeholder="# Heading&#10;&#10;Write safe Markdown content here."
            />
            <span className="mt-1 block text-xs text-slate-500">
              Executable HTML is not rendered. Use headings, lists, bold text,
              code, and HTTPS Markdown links.
            </span>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Program
            <select
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            >
              <option value="">General</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.code ?? program.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Category
            <select
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            Google Drive URL (optional)
            <input
              type="url"
              value={driveUrl}
              onChange={(event) => setDriveUrl(event.target.value)}
              placeholder="https://drive.google.com/..."
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Resource count
            <input
              type="number"
              min={0}
              value={resourceCount}
              onChange={(event) => setResourceCount(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Reading time (minutes)
            <input
              type="number"
              min={1}
              max={600}
              value={readingTime}
              onChange={(event) => setReadingTime(Number(event.target.value))}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            />
          </label>
        </div>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-2 font-bold text-[#002147]">Cover image</legend>
          {(coverPreview || (!removeCover && post?.coverImageUrl)) && (
            <img
              src={coverPreview ?? post?.coverImageUrl ?? ""}
              alt="Academic post cover preview"
              className="mb-4 max-h-64 w-full rounded-xl object-cover"
            />
          )}
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold">
              <ImagePlus size={17} aria-hidden="true" />
              {post?.coverImageUrl ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) {
                    try {
                      validateAcademicPostCover(file);
                      setCoverFile(file);
                      setRemoveCover(false);
                      setError("");
                    } catch (fileError) {
                      setError(
                        fileError instanceof Error
                          ? fileError.message
                          : "Invalid cover image.",
                      );
                    }
                  }
                }}
              />
            </label>
            {(coverFile || post?.coverImageUrl) && (
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null);
                  setRemoveCover(true);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-300 px-4 text-sm font-bold text-red-700"
              >
                <Trash2 size={17} aria-hidden="true" />
                Remove image
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            JPEG, PNG, or WebP. Maximum 5 MB.
          </p>
        </fieldset>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Schedule publication
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-300 px-4 text-sm font-semibold">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-5 w-5"
            />
            Feature this post when published
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            SEO title
            <input
              maxLength={240}
              value={seoTitle}
              onChange={(event) => setSeoTitle(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3"
            />
          </label>
          <label className="md:col-span-2 text-sm font-semibold text-slate-700">
            SEO description
            <textarea
              maxLength={300}
              rows={3}
              value={seoDescription}
              onChange={(event) => setSeoDescription(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("draft")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-5 font-bold disabled:opacity-50"
          >
            <Save size={17} aria-hidden="true" />
            Save draft
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("published")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#002147] px-5 font-bold text-white disabled:opacity-50"
          >
            <Send size={17} aria-hidden="true" />
            Publish
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit("scheduled")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#85591f] px-5 font-bold text-white disabled:opacity-50"
          >
            <Timer size={17} aria-hidden="true" />
            Schedule
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 rounded-xl px-5 font-bold text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
