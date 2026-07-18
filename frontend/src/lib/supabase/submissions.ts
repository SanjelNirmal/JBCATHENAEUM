import { publicEnvironment } from "../env";
import { supabase } from "./client";
import type { SubmissionStatus } from "./database.types";

export interface ResourceUploadInput {
  resourceId?: string;
  campusId: string;
  programId: string;
  curriculumVersionId: string;
  termId: string;
  subjectId: string;
  categoryId: string;
  title: string;
  description: string;
  academicYear: number;
  acceptedUploadPolicySlug?: string;
  acceptedUploadPolicyVersion?: string;
}
export interface UploadSessionResponse {
  sessionId: string;
  resourceId: string;
  expiresAt: string;
  signedUrl: string;
}

async function invokeFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let payload = data as Record<string, unknown> | null;
    if (!payload && "context" in error && error.context instanceof Response) {
      try {
        payload = (await error.context.clone().json()) as Record<
          string,
          unknown
        >;
      } catch {
        payload = null;
      }
    }
    const failure = new Error(
      typeof payload?.message === "string" ? payload.message : error.message,
    ) as Error & { code?: string };
    if (typeof payload?.error === "string") failure.code = payload.error;
    else if (typeof payload?.code === "string") failure.code = payload.code;
    throw failure;
  }
  if (data?.error) {
    const failure = new Error(data.message || "Request failed.") as Error & {
      code?: string;
    };
    if (typeof data.error === "string") failure.code = data.error;
    throw failure;
  }
  return data as T;
}

export function createUploadSession(input: ResourceUploadInput, file: File) {
  const {
    acceptedUploadPolicySlug,
    acceptedUploadPolicyVersion,
    ...resourceInput
  } = input;
  return invokeFunction<UploadSessionResponse>("create-upload-session", {
    ...resourceInput,
    acceptedPolicySlug: acceptedUploadPolicySlug,
    acceptedPolicyVersion: acceptedUploadPolicyVersion,
    fileName: file.name,
    mimeType: "application/pdf",
    byteSize: file.size,
  });
}

export function uploadPdfWithProgress(
  signedUrl: string,
  file: File,
  onProgress: (percentage: number) => void,
) {
  const request = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(
            new Error(
              `The Storage upload failed with HTTP ${request.status}. Retry while the session is active.`,
            ),
          ),
    );
    request.addEventListener("error", () =>
      reject(new Error("The upload was interrupted by a network error.")),
    );
    request.addEventListener("abort", () =>
      reject(new DOMException("Upload cancelled", "AbortError")),
    );
    request.open("PUT", signedUrl);
    request.setRequestHeader(
      "apikey",
      publicEnvironment.config.supabaseAnonKey,
    );
    request.setRequestHeader(
      "Authorization",
      `Bearer ${publicEnvironment.config.supabaseAnonKey}`,
    );
    request.setRequestHeader("x-upsert", "true");
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);
    request.send(form);
  });
  return { promise, abort: () => request.abort() };
}

export function finalizeResourceUpload(sessionId: string) {
  return invokeFunction<{ submissionId: string; status: string }>(
    "finalize-upload",
    { sessionId },
  );
}
export function cancelResourceUpload(sessionId: string) {
  return invokeFunction<{ status: string }>("cancel-upload", { sessionId });
}

export interface ContributorSubmission {
  submissionId: string;
  resourceId: string;
  versionId: string;
  status: SubmissionStatus;
  resourceStatus: string;
  submittedAt: string;
  title: string;
  description: string;
  academicYear: number | null;
  campusId: string;
  programId: string;
  curriculumVersionId: string;
  termId: string;
  subjectId: string;
  categoryId: string;
  feedback: string | null;
  rejectionReason: string | null;
}

export async function fetchContributorSubmissions(): Promise<
  ContributorSubmission[]
> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    throw authError ?? new Error("Authentication is required.");
  const { data: submissions, error } = await supabase
    .from("resource_submissions")
    .select("id,resource_id,version_id,status,submitted_at")
    .eq("submitter_id", auth.user.id)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  if (!submissions?.length) return [];
  const ids = [...new Set(submissions.map((item) => item.resource_id))];
  const [resources, reviews] = await Promise.all([
    supabase
      .from("resources")
      .select(
        "id,title,description,academic_year,campus_id,program_id,curriculum_version_id,term_id,subject_id,category_id,status",
      )
      .in("id", ids),
    supabase
      .from("resource_reviews")
      .select("resource_id,rejection_reason,requested_changes,created_at")
      .in("resource_id", ids)
      .order("created_at", { ascending: false }),
  ]);
  if (resources.error) throw resources.error;
  if (reviews.error) throw reviews.error;
  const latest = new Map<string, (typeof submissions)[number]>();
  for (const item of submissions)
    if (!latest.has(item.resource_id)) latest.set(item.resource_id, item);
  return [...latest.values()].flatMap((submission) => {
    const resource = (resources.data ?? []).find(
      (item) => item.id === submission.resource_id,
    );
    if (!resource) return [];
    const review = (reviews.data ?? []).find(
      (item) => item.resource_id === resource.id,
    );
    return [
      {
        submissionId: submission.id,
        resourceId: resource.id,
        versionId: submission.version_id,
        status: submission.status as SubmissionStatus,
        resourceStatus: resource.status,
        submittedAt: submission.submitted_at,
        title: resource.title,
        description: resource.description ?? "",
        academicYear: resource.academic_year,
        campusId: resource.campus_id,
        programId: resource.program_id,
        curriculumVersionId: resource.curriculum_version_id,
        termId: resource.term_id,
        subjectId: resource.subject_id,
        categoryId: resource.category_id,
        feedback: review?.requested_changes ?? review?.rejection_reason ?? null,
        rejectionReason: review?.rejection_reason ?? null,
      },
    ];
  });
}

export const CONTRIBUTION_DRAFT_KEY = "jbc-contribution-draft-v1";
export function saveContributionDraft(
  input: Omit<ResourceUploadInput, "resourceId">,
) {
  localStorage.setItem(CONTRIBUTION_DRAFT_KEY, JSON.stringify(input));
}
export function loadContributionDraft(): Omit<
  ResourceUploadInput,
  "resourceId"
> | null {
  try {
    return JSON.parse(
      localStorage.getItem(CONTRIBUTION_DRAFT_KEY) ?? "null",
    ) as Omit<ResourceUploadInput, "resourceId"> | null;
  } catch {
    return null;
  }
}
export function clearContributionDraft() {
  localStorage.removeItem(CONTRIBUTION_DRAFT_KEY);
}

export { invokeFunction };
