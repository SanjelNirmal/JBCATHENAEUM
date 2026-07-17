import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchReviewQueue } from "../supabase/reviews";

const client = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("../supabase/client", () => ({
  supabase: { rpc: client.rpc },
}));

describe("fetchReviewQueue", () => {
  beforeEach(() => client.rpc.mockReset());

  it("loads and maps the protected review queue RPC", async () => {
    client.rpc.mockResolvedValue({
      error: null,
      data: [
        {
          submission_id: "submission",
          resource_id: "resource",
          version_id: "version",
          submitter_id: "student",
          contributor: "Student",
          status: "submitted",
          submitted_at: "2026-07-17T00:00:00Z",
          title: "Economics Notes",
          program: "BBS",
          faculty: "Management",
          term: "First Semester",
          subject: "Economics",
          category: "Notes",
          byte_size: 1200,
          page_count: 2,
          mime_type: "application/pdf",
          scan_status: "clean",
          duplicate_warning: false,
          review_notes: ["Ready for review"],
          total_count: 3,
        },
      ],
    });

    await expect(
      fetchReviewQueue(2, 20, "  Economics  ", "submitted"),
    ).resolves.toEqual({
      total: 3,
      items: [
        expect.objectContaining({
          submissionId: "submission",
          resourceId: "resource",
          versionId: "version",
          contributor: "Student",
          semester: "First Semester",
          scanStatus: "clean",
          reviewNotes: ["Ready for review"],
        }),
      ],
    });
    expect(client.rpc).toHaveBeenCalledWith("list_review_queue", {
      search_query: "Economics",
      status_filter: "submitted",
      page_number: 2,
      page_size: 20,
    });
  });

  it("surfaces database errors", async () => {
    const error = new Error("forbidden");
    client.rpc.mockResolvedValue({ data: null, error });

    await expect(fetchReviewQueue()).rejects.toBe(error);
  });
});
