import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

const MAX_UPLOAD_BYTES = Number(Deno.env.get("MAX_UPLOAD_BYTES") ?? 26_214_400);
const UPLOAD_POLICY_SLUG = "upload";
const UPLOAD_POLICY_VERSION = "1.0";

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  try {
    const { user } = await authenticatedUser(request);
    const body = await request.json();
    const fileName = String(body.fileName ?? "");
    const mimeType = String(body.mimeType ?? "");
    const byteSize = Number(body.byteSize);
    const acceptedPolicySlug = String(body.acceptedPolicySlug ?? "");
    const acceptedPolicyVersion = String(body.acceptedPolicyVersion ?? "");

    if (
      acceptedPolicySlug !== UPLOAD_POLICY_SLUG ||
      acceptedPolicyVersion !== UPLOAD_POLICY_VERSION
    ) {
      throw new PublicError(
        "policy_acceptance_required",
        "Confirm the current Upload Policy before uploading.",
      );
    }
    if (
      !fileName.toLowerCase().endsWith(".pdf") ||
      /[\\/]/.test(fileName) ||
      fileName.length > 200
    ) {
      throw new PublicError(
        "invalid_filename",
        "Select a PDF with a valid filename.",
      );
    }
    if (mimeType !== "application/pdf") {
      throw new PublicError("invalid_mime", "Only PDF uploads are accepted.");
    }
    if (
      !Number.isSafeInteger(byteSize) ||
      byteSize <= 0 ||
      byteSize > MAX_UPLOAD_BYTES
    ) {
      throw new PublicError(
        "invalid_size",
        `PDF files must be between 1 byte and ${Math.floor(MAX_UPLOAD_BYTES / 1_048_576)} MB.`,
      );
    }

    const service = serviceClient();
    const { data: session, error: sessionError } = await service.rpc(
      "create_resource_upload_session",
      {
        request_user_id: user.id,
        target_campus_id: body.campusId,
        target_program_id: body.programId,
        target_curriculum_version_id: body.curriculumVersionId,
        target_term_id: body.termId,
        target_subject_id: body.subjectId,
        target_category_id: body.categoryId,
        resource_title: body.title,
        resource_description: body.description,
        resource_academic_year: body.academicYear || null,
        original_file_name: fileName,
        declared_mime_type: mimeType,
        expected_bytes: byteSize,
        accepted_policy_slug: acceptedPolicySlug,
        accepted_policy_version: acceptedPolicyVersion,
        existing_resource_id: body.resourceId || null,
      },
    );
    if (sessionError || !session)
      throw sessionError ?? new Error("Upload session was not created");

    const { data: signedUpload, error: signedError } = await service.storage
      .from(session.bucket)
      .createSignedUploadUrl(session.path, { upsert: true });

    if (signedError || !signedUpload) {
      await service.rpc("fail_resource_upload", {
        target_session_id: session.session_id,
        request_user_id: user.id,
        target_status: "failed",
        supplied_failure_code: "signed_url_failed",
        validation_result: { stage: "issue" },
      });
      throw signedError ?? new Error("Signed upload URL was not created");
    }

    return jsonResponse(request, {
      sessionId: session.session_id,
      resourceId: session.resource_id,
      expiresAt: session.expires_at,
      signedUrl: signedUpload.signedUrl,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
});
