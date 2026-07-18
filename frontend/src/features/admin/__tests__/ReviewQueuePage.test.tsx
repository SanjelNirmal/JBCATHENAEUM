import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ReviewQueuePage from "../ReviewQueuePage";

const review = vi.hoisted(() => ({
  assignResourceReviewer: vi.fn(),
  archiveReviewSubmission: vi.fn(),
  claimResourceReview: vi.fn().mockResolvedValue(undefined),
  decideResourceReview: vi.fn().mockResolvedValue({ status: "approved" }),
  fetchReviewQueue: vi.fn(),
  getReviewFileUrl: vi.fn(),
  publishApprovedResource: vi.fn().mockResolvedValue({ status: "published" }),
}));
vi.mock("../../../app/AuthContext", () => ({
  useCurrentAuth: () => ({
    user: { id: "admin" },
    profile: { role: "admin" },
    loading: false,
    aal: "aal2",
    emailVerified: true,
  }),
}));
vi.mock("../../../lib/supabase/reviews", () => review);
vi.mock("../../../lib/supabase/profiles", () => ({
  fetchUsers: vi.fn().mockResolvedValue([]),
}));

describe("ReviewQueuePage", () => {
  it("confirms and executes an audited review decision", async () => {
    review.fetchReviewQueue.mockResolvedValue({
      total: 1,
      items: [
        {
          submissionId: "submission",
          resourceId: "resource",
          versionId: "version",
          submitterId: "student",
          contributor: "Student",
          status: "submitted",
          submittedAt: "2026-07-17T00:00:00Z",
          title: "Economics Notes",
          program: "BBS",
          faculty: "Management",
          term: "First",
          semester: "First",
          subject: "Economics",
          category: "Notes",
          byteSize: 1200,
          pageCount: 2,
          mimeType: "application/pdf",
          scanStatus: "pending",
          duplicateWarning: false,
          reviewNotes: [],
        },
      ],
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ReviewQueuePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(
      await screen.findByLabelText("Select Economics Notes"),
    );
    expect(screen.getAllByText("Manual review pending").length).toBeGreaterThan(
      0,
    );
    for (const button of screen.getAllByRole("button", { name: "Preview" })) {
      expect(button).toBeEnabled();
    }
    await userEvent.click(
      screen.getAllByRole("button", { name: "Approve" })[0],
    );
    expect(
      screen.getByRole("dialog", { name: /approved 1 submission/i }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Apply decision" }),
    );
    expect(review.claimResourceReview).toHaveBeenCalledWith("submission");
    expect(review.decideResourceReview).toHaveBeenCalledWith(
      "submission",
      "approved",
      "",
    );
    expect(review.publishApprovedResource).toHaveBeenCalledWith("resource");
  });

  it("prevents a moderator from selecting or deciding their own submission", async () => {
    review.fetchReviewQueue.mockResolvedValue({
      total: 1,
      items: [
        {
          submissionId: "own-submission",
          resourceId: "resource",
          versionId: "version",
          submitterId: "admin",
          contributor: "Current reviewer",
          status: "submitted",
          submittedAt: "2026-07-17T00:00:00Z",
          title: "Own Notes",
          program: "BCA",
          faculty: "Humanities",
          term: "Fourth Semester",
          semester: "Fourth Semester",
          subject: "Project-I",
          category: "Notes",
          byteSize: 1200,
          pageCount: 2,
          mimeType: "application/pdf",
          scanStatus: "clean",
          duplicateWarning: false,
          reviewNotes: [],
        },
      ],
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ReviewQueuePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByLabelText("Select Own Notes")).toBeDisabled();
    expect(
      screen.getAllByText(/another reviewer required/i).length,
    ).toBeGreaterThan(0);
    for (const button of screen.getAllByRole("button", { name: "Approve" })) {
      expect(button).toBeDisabled();
    }
  });

  it("shows an automated rejection as read-only admin history", async () => {
    review.fetchReviewQueue.mockResolvedValue({
      total: 1,
      items: [
        {
          submissionId: "auto-rejected-submission",
          resourceId: "resource",
          versionId: "rejected-version",
          submitterId: "student",
          contributor: "Student",
          status: "rejected",
          submittedAt: "2026-07-18T00:00:00Z",
          title: "Rejected Project",
          program: "BCA",
          faculty: "Humanities",
          term: "Fourth Semester",
          semester: "Fourth Semester",
          subject: "Project-I",
          category: "Project",
          byteSize: 1200,
          pageCount: null,
          mimeType: "application/pdf",
          scanStatus: "rejected",
          duplicateWarning: false,
          reviewNotes: ["Automated check: unsafe pdf feature"],
        },
      ],
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ReviewQueuePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText("Rejected Project")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("option", { name: "Rejected" })).toBeInTheDocument();
    for (const checkbox of screen.getAllByLabelText(
      "Select Rejected Project",
    )) {
      expect(checkbox).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", { name: "Approve" })) {
      expect(button).toBeDisabled();
    }
    for (const button of screen.getAllByRole("button", { name: "Preview" })) {
      expect(button).toBeDisabled();
    }
    expect(
      screen.getAllByText(/automated check: unsafe pdf feature/i).length,
    ).toBeGreaterThan(0);
  });
});
