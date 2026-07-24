import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AcademicPost } from "../types";
import { HomeAcademicPostsSection } from "../HomeAcademicPostsSection";

const service = vi.hoisted(() => ({
  fetchPublishedAcademicPosts: vi.fn(),
  fetchFeaturedAcademicPost: vi.fn(),
  recordAcademicPostEvent: vi.fn(),
}));

vi.mock("../../../lib/supabase/academicPosts", () => service);

const featuredPost: AcademicPost = {
  id: "30000000-0000-4000-8000-000000000001",
  title: "Campus Academic Update",
  slug: "campus-academic-update",
  excerpt: "A current academic update for Jana Bhawana Campus students.",
  body: "# Campus update",
  authorId: "40000000-0000-4000-8000-000000000001",
  authorName: "JBC Academic Team",
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
  readingTimeMinutes: 3,
  status: "published",
  isFeatured: true,
  featuredOrder: 1,
  publishedAt: "2026-07-24T00:00:00.000Z",
  scheduledFor: null,
  archivedAt: null,
  viewCount: 9,
  driveOpenCount: 0,
  shareCount: 0,
  seoTitle: null,
  seoDescription: null,
  createdAt: "2026-07-24T00:00:00.000Z",
  updatedAt: "2026-07-24T00:00:00.000Z",
  deletedAt: null,
};

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomeAcademicPostsSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomeAcademicPostsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.fetchFeaturedAcademicPost.mockResolvedValue(featuredPost);
    service.fetchPublishedAcademicPosts.mockResolvedValue({
      items: [featuredPost],
      total: 1,
      page: 1,
      pageSize: 4,
    });
  });

  it("shows the published featured post and archive link", async () => {
    renderSection();

    expect(
      await screen.findByRole("heading", { name: "Campus Academic Update" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View all posts" }),
    ).toHaveAttribute("href", "/posts");
    expect(
      screen.queryByRole("link", { name: /Open Google Drive resources/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Drive resources/)).not.toBeInTheDocument();
  });
});
