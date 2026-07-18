import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ResourceDetailPage from "../ResourceDetailPage";

vi.mock("../../app/AuthContext", () => ({
  useCurrentAuth: () => ({ user: null }),
}));

vi.mock("../../features/engagement/ResourceEngagementPanel", () => ({
  ResourceEngagementPanel: () => <div>Resource engagement</div>,
}));

vi.mock("../../lib/supabase/resources", () => ({
  fetchResource: vi.fn().mockResolvedValue({
    id: "00000000-0000-4000-8000-000000000001",
    slug: "project-one",
    title: "Project I",
    description: "Project proposal",
    academicYear: 2026,
    resourceType: "project",
    programId: "program-1",
    programName: "BCA",
    facultyId: "faculty-1",
    facultyName: "Humanities and Social Sciences",
    termId: "term-1",
    termName: "Sixth Semester",
    subjectId: "subject-1",
    subjectName: "Project-I",
    categoryId: "category-1",
    categoryName: "Projects",
    contributorName: "Student",
    byteSize: 1_048_576,
    pageCount: 12,
    legacyUrl: null,
    downloadCount: 4,
    createdAt: "2026-07-17T00:00:00.000Z",
  }),
  getLegacyPreviewUrl: vi.fn(),
  getPublicResourceAccessUrl: vi
    .fn()
    .mockReturnValue("data:application/pdf,"),
  getTrackedResourceAccess: vi.fn().mockResolvedValue({
    viewerUrl: "https://example.test/signed-document",
    downloadCount: 5,
  }),
  reportResource: vi.fn(),
}));

describe("ResourceDetailPage", () => {
  it("keeps the PDF inside the preview and enables iframe scrolling", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/resources/project-one"]}>
          <Routes>
            <Route
              path="/resources/:resourceId"
              element={<ResourceDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const preview = await screen.findByTitle("Preview of Project I");
    expect(preview).toHaveAttribute("scrolling", "yes");
    expect(preview).toHaveClass("touch-pan-y", "overflow-y-auto");
    expect(
      screen.queryByRole("link", { name: /Open full document/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open in new window" }),
    ).toBeInTheDocument();
  });

  it("counts the open, offers optional support, and opens a new window", async () => {
    const replace = vi.fn();
    const target = {
      location: { replace },
      opener: window,
    } as unknown as Window;
    const windowOpen = vi.spyOn(window, "open").mockReturnValue(target);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/resources/project-one"]}>
          <Routes>
            <Route
              path="/resources/:resourceId"
              element={<ResourceDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "Open in new window" }),
    );
    expect(
      screen.getByRole("dialog", { name: "Buy Me a Coffee" }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: "Maybe later — open document",
      }),
    );
    expect(
      screen.queryByRole("dialog", { name: "Buy Me a Coffee" }),
    ).not.toBeInTheDocument();
    expect(windowOpen).toHaveBeenCalledWith("about:blank", "_blank");
    expect(replace).toHaveBeenCalledWith(
      "https://example.test/signed-document#toolbar=0&navpanes=0&scrollbar=1&view=FitH",
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    windowOpen.mockRestore();
  });
});
