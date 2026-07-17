import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ResourceDetailPage from "../ResourceDetailPage";

vi.mock("../../app/AuthContext", () => ({
  useCurrentAuth: () => ({ user: null }),
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
  getPublicResourceAccessUrl: vi.fn().mockReturnValue("about:blank"),
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
  });
});
