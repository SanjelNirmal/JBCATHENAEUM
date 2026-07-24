import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicPost } from "../types";
import { AcademicPostsSection } from "../AcademicPostsSection";
import { safeGoogleDriveUrl } from "../utils";

const service = vi.hoisted(() => ({
  fetchPublishedAcademicPosts: vi.fn(),
  fetchFeaturedAcademicPost: vi.fn(),
  fetchAcademicPostCategories: vi.fn(),
  fetchAcademicPostPrograms: vi.fn(),
  recordAcademicPostEvent: vi.fn(),
}));

vi.mock("../../../lib/supabase/academicPosts", () => service);

const category = {
  id: "10000000-0000-4000-8000-000000000001",
  name: "Notes",
  slug: "notes",
  description: null,
  isActive: true,
  sortOrder: 10,
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
};
const program = {
  id: "20000000-0000-4000-8000-000000000001",
  name: "Bachelor of Computer Applications",
  slug: "bca",
  code: "BCA",
};
const post: AcademicPost = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Database Management Systems",
  slug: "database-management-systems",
  excerpt: "Published DBMS notes for BCA students.",
  body: "# DBMS\n\nSafe Markdown body.",
  authorId: "40000000-0000-4000-8000-000000000001",
  authorName: "JBC Academic Team",
  program,
  category,
  coverImagePath: null,
  coverImageUrl: null,
  driveUrl: "https://drive.google.com/drive/folders/real-resource",
  resourceCount: 5,
  readingTimeMinutes: 4,
  status: "published",
  isFeatured: true,
  featuredOrder: 1,
  publishedAt: "2026-07-24T00:00:00.000Z",
  scheduledFor: null,
  archivedAt: null,
  viewCount: 12,
  driveOpenCount: 2,
  shareCount: 1,
  seoTitle: null,
  seoDescription: null,
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
  deletedAt: null,
};

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AcademicPostsSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AcademicPostsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.fetchAcademicPostPrograms.mockResolvedValue([program]);
    service.fetchAcademicPostCategories.mockResolvedValue([category]);
    service.fetchFeaturedAcademicPost.mockResolvedValue(post);
    service.fetchPublishedAcademicPosts.mockImplementation(
      async ({ search = "" }: { search?: string }) => ({
        items: search.toLowerCase().includes("missing") ? [] : [post],
        total: search.toLowerCase().includes("missing") ? 0 : 1,
        page: 1,
        pageSize: 9,
      }),
    );
  });

  it("renders Supabase-backed featured content and secure Drive links", async () => {
    renderSection();
    expect(
      await screen.findByRole("heading", {
        name: "Database Management Systems",
      }),
    ).toBeInTheDocument();
    const drive = screen.getByRole("link", {
      name: "Open Google Drive resources for Database Management Systems",
    });
    expect(drive).toHaveAttribute("target", "_blank");
    expect(drive).toHaveAttribute("rel", "noopener noreferrer");
    expect(
      screen.getByRole("link", { name: "View all posts" }),
    ).toHaveAttribute("href", "/posts");
  });

  it("queries the database as search text changes", async () => {
    const user = userEvent.setup();
    renderSection();
    await screen.findByRole("heading", {
      name: "Database Management Systems",
    });
    await user.type(
      screen.getByRole("searchbox", {
        name: "Search academic posts by title, program, or category",
      }),
      "missing",
    );
    expect(
      await screen.findByRole("heading", {
        name: "No matching academic posts",
      }),
    ).toBeInTheDocument();
    expect(service.fetchPublishedAcademicPosts).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "missing" }),
    );
  });
});

describe("safeGoogleDriveUrl", () => {
  it("allows only HTTPS Google Drive or Docs destinations", () => {
    expect(
      safeGoogleDriveUrl(
        "https://drive.google.com/drive/folders/real-resource",
      ),
    ).toContain("drive.google.com");
    expect(safeGoogleDriveUrl("https://example.com/resource")).toBeNull();
    expect(safeGoogleDriveUrl("javascript:alert(1)")).toBeNull();
    expect(safeGoogleDriveUrl(null)).toBeNull();
  });
});
