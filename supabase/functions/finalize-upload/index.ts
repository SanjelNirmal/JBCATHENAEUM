import { PDFDocument } from "npm:pdf-lib@1.17.1";
import { authenticatedUser, serviceClient } from "../_shared/supabase.ts";
import {
  errorResponse,
  handleOptions,
  jsonResponse,
  PublicError,
} from "../_shared/http.ts";

const forbiddenPdfFeatures = [
  "/JavaScript",
  "/JS",
  "/Launch",
  "/EmbeddedFile",
  "/OpenAction",
  "/RichMedia",
  "/SubmitForm",
];

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function validatePdf(bytes: Uint8Array) {
  if (
    bytes.length < 8 ||
    new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-"
  ) {
    throw new PublicError(
      "invalid_signature",
      "The uploaded file does not have a valid PDF signature.",
    );
  }
  const tail = new TextDecoder().decode(
    bytes.slice(Math.max(0, bytes.length - 4096)),
  );
  if (!tail.includes("%%EOF")) {
    throw new PublicError(
      "invalid_structure",
      "The PDF appears incomplete or corrupted.",
    );
  }

  const sourceText = new TextDecoder().decode(bytes);
  const detectedFeature = forbiddenPdfFeatures.find((feature) =>
    sourceText.includes(feature),
  );
  if (detectedFeature) {
    throw new PublicError(
      "unsafe_pdf_feature",
      "The PDF contains an unsupported active or embedded feature.",
    );
  }

  let document: PDFDocument;
  try {
    document = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("encrypt")) {
      throw new PublicError(
        "encrypted_pdf",
        "Password-protected or encrypted PDFs are not accepted.",
      );
    }
    throw new PublicError(
      "invalid_structure",
      "The PDF could not be parsed safely.",
    );
  }

  const pageCount = document.getPageCount();
  if (pageCount < 1 || pageCount > 5000) {
    throw new PublicError(
      "invalid_page_count",
      "The PDF page count is outside the supported range.",
    );
  }
  const checksum = toHex(await crypto.subtle.digest("SHA-256", bytes));
  return { checksum, pageCount };
}

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  if (request.method !== "POST")
    return jsonResponse(request, { error: "method_not_allowed" }, 405);

  let sessionId = "";
  let userId = "";
  try {
    const { user } = await authenticatedUser(request);
    userId = user.id;
    const body = await request.json();
    sessionId = String(body.sessionId ?? "");
    if (!sessionId)
      throw new PublicError("invalid_session", "Upload session is required.");

    const service = serviceClient();
    const { data: session, error: sessionError } = await service
      .from("resource_upload_sessions")
      .select(
        "id,user_id,storage_bucket,storage_path,expected_byte_size,status,expires_at",
      )
      .eq("id", sessionId)
      .single();
    if (sessionError || !session)
      throw new PublicError(
        "invalid_session",
        "Upload session was not found.",
        404,
      );
    if (session.user_id !== user.id)
      throw new PublicError(
        "forbidden",
        "Upload session ownership mismatch.",
        403,
      );
    if (
      session.status !== "issued" ||
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      throw new PublicError(
        "expired_session",
        "Upload session has expired.",
        409,
      );
    }

    const { data: file, error: downloadError } = await service.storage
      .from(session.storage_bucket)
      .download(session.storage_path);
    if (downloadError || !file)
      throw new PublicError(
        "upload_missing",
        "The uploaded object could not be found.",
        409,
      );

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength !== session.expected_byte_size) {
      throw new PublicError(
        "size_mismatch",
        "The uploaded PDF size does not match the issued upload.",
      );
    }

    const validation = await validatePdf(bytes);
    const { data: submissionId, error: completeError } = await service.rpc(
      "complete_resource_upload",
      {
        target_session_id: sessionId,
        request_user_id: user.id,
        actual_byte_size: bytes.byteLength,
        checksum_sha256: validation.checksum,
        detected_page_count: validation.pageCount,
        validation_result: {
          validator: "edge-pdf-v1",
          signature: true,
          eof: true,
          active_features: false,
          encrypted: false,
        },
      },
    );
    if (completeError) {
      if (completeError.code === "23505") {
        throw new PublicError(
          "duplicate_pdf",
          "This PDF already exists in the archive.",
          409,
        );
      }
      throw completeError;
    }
    return jsonResponse(request, { submissionId, status: "submitted" });
  } catch (error) {
    if (sessionId && userId) {
      const service = serviceClient();
      const { data: state } = await service
        .from("resource_upload_sessions")
        .select("storage_bucket,storage_path,status")
        .eq("id", sessionId)
        .maybeSingle();
      if (
        state &&
        state.status !== "submitted" &&
        state.status !== "published"
      ) {
        await service.storage
          .from(state.storage_bucket)
          .remove([state.storage_path]);
        await service.rpc("fail_resource_upload", {
          target_session_id: sessionId,
          request_user_id: userId,
          target_status: "failed",
          supplied_failure_code:
            error instanceof PublicError ? error.code : "validation_failed",
          validation_result: { validator: "edge-pdf-v1", accepted: false },
        });
      }
    }
    return errorResponse(request, error);
  }
});
