export interface PaginationInput {
  page: number;
  pageSize: number;
}

export function normalizePagination(
  input: Partial<PaginationInput>,
  defaultPageSize = 12,
): PaginationInput {
  const page =
    Number.isInteger(input.page) && Number(input.page) > 0
      ? Number(input.page)
      : 1;
  const requested = Number.isInteger(input.pageSize)
    ? Number(input.pageSize)
    : defaultPageSize;
  return { page, pageSize: Math.min(50, Math.max(1, requested)) };
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
}
