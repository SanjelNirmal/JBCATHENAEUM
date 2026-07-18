import {
  ClipboardList,
  FileCheck,
  Info,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AcademicSubjectOption,
  cancelResourceUpload,
  clearContributionDraft,
  ContributorSubmission,
  createUploadSession,
  fetchAcademicCatalog,
  fetchContributorSubmissions,
  finalizeResourceUpload,
  loadContributionDraft,
  ResourceUploadInput,
  saveContributionDraft,
  uploadPdfWithProgress,
} from "../lib/api";
import { toSafeErrorMessage } from "../lib/supabase/errors";

const MAX_PDF_BYTES = 25 * 1024 * 1024;

type UploadState =
  | "idle"
  | "preparing"
  | "uploading"
  | "validating"
  | "success"
  | "error"
  | "cancelled";

interface PendingUpload {
  sessionId: string;
  signedUrl: string;
}

export function ContributeView({
  initialName,
  isAuthenticated,
  emailVerified = false,
  onLogin,
}: {
  initialName?: string;
  isAuthenticated: boolean;
  emailVerified?: boolean;
  onLogin?: () => void;
}) {
  const [catalog, setCatalog] = useState<AcademicSubjectOption[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [programId, setProgramId] = useState("");
  const [termId, setTermId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [submissions, setSubmissions] = useState<ContributorSubmission[]>([]);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [resubmitResourceId, setResubmitResourceId] = useState<string | null>(
    null,
  );
  const pendingUploadRef = useRef<PendingUpload | null>(null);
  const abortUploadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    void fetchAcademicCatalog()
      .then((options) => {
        setCatalog(options);
        const draft = loadContributionDraft();
        const first = draft
          ? options.find((item) => item.subjectId === draft.subjectId)
          : options[0];
        if (first) {
          setProgramId(draft?.programId ?? first.programId);
          setTermId(draft?.termId ?? first.termId);
          setSubjectId(draft?.subjectId ?? first.subjectId);
          setCategoryId(draft?.categoryId ?? first.categories[0]?.id ?? "");
          if (draft) {
            setTitle(draft.title);
            setDescription(draft.description);
            setAcademicYear(draft.academicYear);
          }
        }
      })
      .catch((error: unknown) => {
        setCatalogError(toSafeErrorMessage(error, "network"));
      });
  }, []);

  const loadSubmissions = async () => {
    if (!isAuthenticated) return;
    try {
      setSubmissions(await fetchContributorSubmissions());
      setSubmissionsError(null);
    } catch (error) {
      setSubmissionsError(toSafeErrorMessage(error, "network"));
    }
  };

  useEffect(() => {
    void loadSubmissions();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!catalog.length || !submissions.length || resubmitResourceId) return;
    const requestedId = new URLSearchParams(window.location.search).get(
      "resubmit",
    );
    const requested = submissions.find(
      (item) => item.resourceId === requestedId,
    );
    if (
      requested &&
      ["changes_requested", "rejected"].includes(requested.resourceStatus)
    )
      startResubmission(requested);
  }, [catalog, submissions]);

  useEffect(() => {
    const selection = catalog.find((item) => item.subjectId === subjectId);
    if (!selection || !categoryId || !title.trim() || !description.trim())
      return;
    saveContributionDraft({
      campusId: selection.campusId,
      programId: selection.programId,
      curriculumVersionId: selection.curriculumVersionId,
      termId: selection.termId,
      subjectId: selection.subjectId,
      categoryId,
      title,
      description,
      academicYear,
    });
  }, [catalog, subjectId, categoryId, title, description, academicYear]);

  const programs = useMemo(
    () =>
      Array.from(
        new Map(catalog.map((item) => [item.programId, item])).values(),
      ),
    [catalog],
  );
  const terms = useMemo(
    () =>
      Array.from(
        new Map(
          catalog
            .filter((item) => item.programId === programId)
            .map((item) => [item.termId, item]),
        ).values(),
      ),
    [catalog, programId],
  );
  const subjects = useMemo(
    () =>
      catalog.filter(
        (item) => item.programId === programId && item.termId === termId,
      ),
    [catalog, programId, termId],
  );
  const selection = catalog.find((item) => item.subjectId === subjectId);

  const resetAcademicSelection = (nextProgramId: string) => {
    const next = catalog.find((item) => item.programId === nextProgramId);
    setProgramId(nextProgramId);
    setTermId(next?.termId ?? "");
    setSubjectId(next?.subjectId ?? "");
    setCategoryId(next?.categories[0]?.id ?? "");
  };

  const handleFile = (selectedFile: File | null) => {
    setMessage("");
    const previous = pendingUploadRef.current;
    if (previous)
      void cancelResourceUpload(previous.sessionId).catch(() =>
        console.warn("Upload cleanup was queued for retry."),
      );
    pendingUploadRef.current = null;
    setFile(null);
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (
      selectedFile.type !== "application/pdf" ||
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setUploadState("error");
      setMessage(
        "Only files with a .pdf extension and application/pdf MIME type are accepted.",
      );
      return;
    }
    if (selectedFile.size <= 0 || selectedFile.size > MAX_PDF_BYTES) {
      setUploadState("error");
      setMessage("PDF files must be non-empty and no larger than 25 MB.");
      return;
    }
    setFile(selectedFile);
    setUploadState("idle");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }
    if (!emailVerified) {
      setUploadState("error");
      setMessage("Verify your email address before uploading.");
      return;
    }
    if (!selection || !categoryId || !file) {
      setUploadState("error");
      setMessage("Select academic metadata and a PDF before submitting.");
      return;
    }

    let stage: "prepare" | "upload" | "finalize" = "prepare";
    try {
      setMessage("");
      let pending = pendingUploadRef.current;
      if (!pending) {
        setUploadState("preparing");
        const input: ResourceUploadInput = {
          resourceId: resubmitResourceId ?? undefined,
          campusId: selection.campusId,
          programId: selection.programId,
          curriculumVersionId: selection.curriculumVersionId,
          termId: selection.termId,
          subjectId: selection.subjectId,
          categoryId,
          title,
          description,
          academicYear,
        };
        const issued = await createUploadSession(input, file);
        pending = { sessionId: issued.sessionId, signedUrl: issued.signedUrl };
        pendingUploadRef.current = pending;
      }

      stage = "upload";
      setUploadState("uploading");
      const upload = uploadPdfWithProgress(
        pending.signedUrl,
        file,
        setProgress,
      );
      abortUploadRef.current = upload.abort;
      await upload.promise;
      abortUploadRef.current = null;

      stage = "finalize";
      setUploadState("validating");
      const result = await finalizeResourceUpload(pending.sessionId);
      pendingUploadRef.current = null;
      setUploadState("success");
      setMessage(
        `Submission ${result.submissionId} passed validation and entered the review queue.`,
      );
      setTitle("");
      setDescription("");
      setFile(null);
      setResubmitResourceId(null);
      clearContributionDraft();
      setProgress(100);
      await loadSubmissions();
    } catch (error) {
      abortUploadRef.current = null;
      if (stage === "finalize") pendingUploadRef.current = null;
      if (error instanceof DOMException && error.name === "AbortError") {
        setUploadState("cancelled");
        setMessage(
          "Upload cancelled. The quarantine object is being cleaned up.",
        );
      } else {
        setUploadState("error");
        setMessage(toSafeErrorMessage(error, "upload"));
      }
    }
  };

  const cancelUpload = async () => {
    abortUploadRef.current?.();
    const pending = pendingUploadRef.current;
    pendingUploadRef.current = null;
    if (pending) {
      try {
        await cancelResourceUpload(pending.sessionId);
      } catch {
        console.warn(
          "Upload cleanup will be retried by the scheduled cleanup job.",
        );
      }
    }
    setUploadState("cancelled");
    setMessage("Upload cancelled.");
  };

  const busy = ["preparing", "uploading", "validating"].includes(uploadState);

  const startResubmission = (submission: ContributorSubmission) => {
    const academic = catalog.find(
      (item) =>
        item.campusId === submission.campusId &&
        item.programId === submission.programId &&
        item.curriculumVersionId === submission.curriculumVersionId &&
        item.termId === submission.termId &&
        item.subjectId === submission.subjectId,
    );
    if (!academic) {
      setMessage(
        "This submission's academic selection is no longer active. Ask an administrator to restore it before resubmitting.",
      );
      setUploadState("error");
      return;
    }
    const previous = pendingUploadRef.current;
    if (previous)
      void cancelResourceUpload(previous.sessionId).catch(() =>
        console.warn("Upload cleanup was queued for retry."),
      );
    pendingUploadRef.current = null;
    setResubmitResourceId(submission.resourceId);
    setProgramId(submission.programId);
    setTermId(submission.termId);
    setSubjectId(submission.subjectId);
    setCategoryId(submission.categoryId);
    setTitle(submission.title);
    setDescription(submission.description);
    setAcademicYear(submission.academicYear ?? new Date().getFullYear());
    setFile(null);
    setProgress(0);
    setUploadState("idle");
    setMessage(
      "Review the requested changes, update the metadata if needed, and select a replacement PDF.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-24 font-sans md:px-12">
      <div className="mb-14 text-center">
        <div className="mb-6 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a642f] sm:text-xs">
          <span
            aria-hidden="true"
            className="h-px w-8 bg-[#c49b63] sm:w-12"
          />
          <span>Contribute to the archive</span>
          <span
            aria-hidden="true"
            className="h-px w-8 bg-[#c49b63] sm:w-12"
          />
        </div>
        <h1 className="mb-6 font-serif text-5xl font-black tracking-tighter text-[#002147] md:text-7xl">
          Share a Resource
        </h1>
        <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-slate-500">
          Share notes, past questions, project reports, or other academic
          materials. Once reviewed, your contribution will become part of the
          JBC archive.
        </p>
      </div>

      {!isAuthenticated || !emailVerified ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-[#002147]">
            {isAuthenticated
              ? "Verify your email before contributing"
              : "Sign in before contributing"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isAuthenticated
              ? "Open the verification message sent by Supabase, then return and refresh this page."
              : "Uploads are tied to an authenticated owner and cannot be submitted anonymously."}
          </p>
          {!isAuthenticated && (
            <button
              onClick={onLogin}
              className="mt-6 rounded-xl bg-[#002147] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white"
            >
              Sign in
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 md:p-12">
          <div className="mb-10 flex items-start gap-4 rounded-2xl bg-slate-50 p-5">
            <Info className="mt-0.5 shrink-0 text-[#c49b63]" size={22} />
            <p className="text-sm leading-6 text-slate-600">
              PDF only, maximum 25 MB. Encrypted files, malformed PDFs,
              duplicate checksums, embedded files, and active PDF actions are
              rejected server-side.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            {resubmitResourceId && (
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                <span>Resubmitting an existing resource as a new version.</span>
                <button
                  type="button"
                  onClick={() => setResubmitResourceId(null)}
                  className="font-bold underline"
                >
                  Start a new submission
                </button>
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Campus
                <input
                  value={selection?.campusName ?? ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-500"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Faculty
                <input
                  value={selection?.facultyName ?? ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-500"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Contributor
                <input
                  value={initialName ?? "Authenticated contributor"}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-slate-500"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Resource title
                <input
                  required
                  minLength={3}
                  maxLength={240}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3 focus:border-[#002147] focus:outline-none"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Program
                <select
                  required
                  value={programId}
                  onChange={(event) =>
                    resetAcademicSelection(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  {programs.map((item) => (
                    <option key={item.programId} value={item.programId}>
                      {item.programName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Term
                <select
                  required
                  value={termId}
                  onChange={(event) => {
                    const next = catalog.find(
                      (item) =>
                        item.programId === programId &&
                        item.termId === event.target.value,
                    );
                    setTermId(event.target.value);
                    setSubjectId(next?.subjectId ?? "");
                    setCategoryId(next?.categories[0]?.id ?? "");
                  }}
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  {terms.map((item) => (
                    <option key={item.termId} value={item.termId}>
                      {item.termName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Subject
                <select
                  required
                  value={subjectId}
                  onChange={(event) => setSubjectId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  {subjects.map((item) => (
                    <option key={item.subjectId} value={item.subjectId}>
                      {item.subjectName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Category
                <select
                  required
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-3"
                >
                  {(selection?.categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Academic year
                <input
                  type="number"
                  min={1959}
                  max={2200}
                  value={academicYear}
                  onChange={(event) =>
                    setAcademicYear(Number(event.target.value))
                  }
                  className="w-full rounded-xl border border-slate-300 p-3"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                PDF document
                <input
                  required={!file}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    handleFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full rounded-xl border border-slate-300 p-2 text-sm"
                />
                {file && (
                  <span className="block text-xs font-normal text-slate-500">
                    {file.name} · {(file.size / 1_048_576).toFixed(2)} MB
                  </span>
                )}
              </label>
            </div>

            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Description
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 focus:border-[#002147] focus:outline-none"
              />
            </label>

            {catalogError && (
              <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {catalogError}
              </p>
            )}
            {uploadState === "uploading" && (
              <div aria-live="polite">
                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-600">
                  <span>Uploading to quarantine</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-[#c49b63] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {message && (
              <p
                aria-live="polite"
                className={`rounded-xl p-4 text-sm ${uploadState === "success" ? "bg-emerald-50 text-emerald-700" : uploadState === "error" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-600"}`}
              >
                {message}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-3">
              <button
                type="submit"
                disabled={busy || Boolean(catalogError) || catalog.length === 0}
                className="flex items-center gap-3 rounded-xl bg-[#002147] px-8 py-4 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : uploadState === "error" && pendingUploadRef.current ? (
                  <RefreshCw size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {uploadState === "validating"
                  ? "Validating PDF"
                  : uploadState === "error" && pendingUploadRef.current
                    ? "Retry upload"
                    : "Upload PDF"}
              </button>
              {busy && (
                <button
                  type="button"
                  onClick={() => void cancelUpload()}
                  className="flex items-center gap-2 rounded-xl border border-red-200 px-6 py-4 text-xs font-bold uppercase tracking-wider text-red-600"
                >
                  <X size={16} /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {isAuthenticated && (
        <section
          className="mt-12 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10"
          aria-labelledby="submission-history-heading"
        >
          <div className="mb-6 flex items-center gap-3">
            <ClipboardList className="text-[#c49b63]" />
            <h2
              id="submission-history-heading"
              className="font-serif text-2xl font-bold text-[#002147]"
            >
              Your submissions
            </h2>
          </div>
          {submissionsError && (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {submissionsError}
            </p>
          )}
          {!submissionsError && submissions.length === 0 && (
            <p className="text-sm text-slate-500">No submissions yet.</p>
          )}
          <div className="space-y-4">
            {submissions.map((submission) => {
              const canResubmit =
                submission.status === "changes_requested" ||
                submission.status === "rejected";
              return (
                <article
                  key={submission.resourceId}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {submission.title}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                        {submission.status.replace("_", " ")} ·{" "}
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                      {submission.feedback && (
                        <p className="mt-3 max-w-2xl rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                          Reviewer feedback: {submission.feedback}
                        </p>
                      )}
                    </div>
                    {canResubmit && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startResubmission(submission)}
                        className="rounded-xl border border-[#002147] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#002147] disabled:opacity-50"
                      >
                        Resubmit PDF
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-16 grid gap-8 text-center md:grid-cols-3">
        {[
          [
            Upload,
            "1. Quarantine",
            "The file uploads to a private, generated path.",
          ],
          [
            FileCheck,
            "2. Validate and review",
            "Automated PDF gates run before moderator review.",
          ],
          [
            FileCheck,
            "3. Private publication",
            "Approved files move to private published Storage and use short-lived links.",
          ],
        ].map(([Icon, heading, text]) => {
          const StepIcon = Icon as typeof Upload;
          return (
            <div key={String(heading)}>
              <StepIcon className="mx-auto mb-3 text-[#c49b63]" />
              <h3 className="font-bold text-slate-800">{String(heading)}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {String(text)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
