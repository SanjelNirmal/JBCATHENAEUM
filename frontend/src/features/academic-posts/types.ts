export const academicPostStatuses = [
  "draft",
  "published",
  "scheduled",
  "archived",
] as const;

export type AcademicPostStatus = (typeof academicPostStatuses)[number];

export interface AcademicPostCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicPostProgram {
  id: string;
  name: string;
  slug: string;
  code: string | null;
}

export interface AcademicPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  authorId: string | null;
  authorName: string;
  program: AcademicPostProgram | null;
  category: AcademicPostCategory;
  coverImagePath: string | null;
  coverImageUrl: string | null;
  driveUrl: string | null;
  resourceCount: number;
  readingTimeMinutes: number;
  status: AcademicPostStatus;
  isFeatured: boolean;
  featuredOrder: number | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  archivedAt: string | null;
  viewCount: number;
  driveOpenCount: number;
  shareCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AcademicPostInput {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  programId: string | null;
  categoryId: string;
  authorName: string;
  driveUrl: string | null;
  resourceCount: number;
  readingTimeMinutes: number;
  status: AcademicPostStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  scheduledFor: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface PublishedAcademicPostFilters {
  search?: string;
  programId?: string;
  categoryId?: string;
  sort?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
}

export interface AdminAcademicPostFilters {
  search?: string;
  status?: AcademicPostStatus | "deleted";
  programId?: string;
  categoryId?: string;
  authorId?: string;
  authorName?: string;
  featured?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAcademicPosts {
  items: AcademicPost[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AcademicPostStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  archived: number;
  featured: number;
}
