import { z } from "zod";

export const resourceFilterSchema = z.object({
  q: z.string().trim().max(120).catch(""),
  faculty: z.string().uuid().optional().catch(undefined),
  program: z.string().uuid().optional().catch(undefined),
  term: z.string().uuid().optional().catch(undefined),
  subject: z.string().uuid().optional().catch(undefined),
  category: z.string().uuid().optional().catch(undefined),
  contributor: z.string().uuid().optional().catch(undefined),
  year: z.coerce.number().int().min(1959).max(2200).optional().catch(undefined),
  from: z.string().datetime({ offset: true }).optional().catch(undefined),
  to: z.string().datetime({ offset: true }).optional().catch(undefined),
  sort: z.enum(["recent", "popular", "oldest", "title"]).catch("recent"),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
});

export type ResourceFilters = z.infer<typeof resourceFilterSchema>;

export function parseResourceFilters(params: URLSearchParams): ResourceFilters {
  return resourceFilterSchema.parse(Object.fromEntries(params.entries()));
}

export function serializeResourceFilters(
  filters: Partial<ResourceFilters>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (
      value !== undefined &&
      value !== "" &&
      value !== null &&
      !(key === "page" && value === 1) &&
      !(key === "pageSize" && value === 12) &&
      !(key === "sort" && value === "recent")
    ) {
      params.set(key, String(value));
    }
  }
  return params;
}
