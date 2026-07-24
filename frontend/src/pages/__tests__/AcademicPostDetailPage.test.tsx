import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicPost } from "../../features/academic-posts/types";
import AcademicPostDetailPage from "../AcademicPostDetailPage";

const service = vi.hoisted(() => ({
  fetchAcademicPostBySlug: vi.fn(),
  fetchRelatedAcademicPosts: vi.fn(),
  incrementAcademicPostView: vi.fn(),
  recordAcademicPostEvent: vi.fn(),
}));

vi.mock("../../lib/supabase/academicPosts", () => service);

const post: AcademicPost = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Campus Academic Notice",
  slug: "campus-academic-notice",
  excerpt: "A published notice without an external resource.",
  body: "# Important notice\n\nStudents should read this update.",
  authorId: null,
  authorName: "Jana Bhawana Campus",
  program: null,
  category: {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Notices",
    slug: "notices",
    description: null,
    isActive: true,
    sortOrder: 1,
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
  },
  coverImagePath: null,
  coverImageUrl: null,
  driveUrl: null,
  resourceCount: 0,
  readingTimeMinutes: 2,
  status: "published",
  isFeatured: false,
  featuredOrder: null,
  publishedAt: "2026-07-24T00:00:00.000Z",
  scheduledFor: null,
  archivedAt: null,
  viewCount: 4,
  driveOpenCount: 0,
  shareCount: 0,
  seoTitle: null,
  seoDescription: null,
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
  deletedAt: null,
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/posts/campus-academic-notice"]}>
        <Routes>
          <Route path="/posts/:slug" element={<AcademicPostDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AcademicPostDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.fetchRelatedAcademicPosts.mockResolvedValue([]);
    service.incrementAcademicPostView.mockResolvedValue(5);
    service.recordAcademicPostEvent.mockResolvedValue(undefined);
  });

  it("renders safe post content, records a view, and hides absent Drive controls", async () => {
    service.fetchAcademicPostBySlug.mockResolvedValue(post);
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Campus Academic Notice" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Important notice" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open Google Drive" }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(service.incrementAcademicPostView).toHaveBeenCalledWith(
        "campus-academic-notice",
      ),
    );
  });

  it("does not expose an unavailable or unpublished post", async () => {
    service.fetchAcademicPostBySlug.mockResolvedValue(null);
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "Post not found" }),
    ).toBeInTheDocument();
    expect(service.incrementAcademicPostView).not.toHaveBeenCalled();
  });
});
