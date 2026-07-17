import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ResourceCatalogPage from "../ResourceCatalogPage";

vi.mock("../../lib/supabase/academic", () => ({
  fetchAcademicCatalog: vi.fn().mockResolvedValue([
    {
      campusId: "00000000-0000-4000-8000-000000000001",
      campusName: "JBC",
      campusSlug: "jbc",
      facultyId: "00000000-0000-4000-8000-000000000002",
      facultyName: "Management",
      facultySlug: "management",
      programId: "00000000-0000-4000-8000-000000000003",
      programName: "BBS",
      programSlug: "bbs",
      curriculumVersionId: "00000000-0000-4000-8000-000000000004",
      curriculumName: "Current",
      termId: "00000000-0000-4000-8000-000000000005",
      termName: "First",
      termSlug: "first",
      subjectId: "00000000-0000-4000-8000-000000000006",
      subjectName: "Economics",
      subjectSlug: "economics",
      categories: [
        {
          id: "00000000-0000-4000-8000-000000000007",
          name: "Notes",
          slug: "notes",
        },
      ],
    },
  ]),
}));
vi.mock("../../lib/supabase/resources", () => ({
  searchResources: vi.fn().mockResolvedValue({
    total: 1,
    page: 1,
    pageSize: 12,
    items: [
      {
        id: "r1",
        slug: "microeconomics",
        title: "Microeconomics",
        description: "Supply and demand notes",
        programName: "BBS",
        termName: "First",
        subjectName: "Economics",
        categoryName: "Notes",
        downloadCount: 4,
      },
    ],
  }),
}));

describe("ResourceCatalogPage", () => {
  it("renders database results and clears URL-backed filters", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/resources?q=economics"]}>
          <ResourceCatalogPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Microeconomics" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 results")).toBeInTheDocument();
    const search = screen.getByPlaceholderText(
      "Title, subject, program, contributor or year",
    );
    expect(search).toHaveValue("economics");
    await userEvent.click(
      screen.getByRole("button", { name: "Clear filters" }),
    );
    await waitFor(() => expect(search).toHaveValue(""));
  });
});
