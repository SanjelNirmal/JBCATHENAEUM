import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("../supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
    auth: { getUser: mocks.getUser },
  },
}));

import { fetchDownloadHistory } from "../supabase/downloadHistory";
import { markAllNotificationsRead } from "../supabase/notifications";
import { fetchRatingSummary, saveRating } from "../supabase/ratings";

describe("account engagement services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only the safe public rating aggregate", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ average_rating: "4.25", rating_count: 8 }],
      error: null,
    });

    await expect(fetchRatingSummary("resource-one")).resolves.toEqual({
      averageRating: 4.25,
      ratingCount: 8,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("get_resource_rating_summary", {
      target_resource_id: "resource-one",
    });
  });

  it("rejects an invalid rating before any identity or database request", async () => {
    await expect(saveRating("resource-one", 6, "No")).rejects.toThrow(
      "invalid_rating",
    );
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("maps a private paginated download-history response", async () => {
    mocks.rpc.mockResolvedValue({
      data: [
        {
          event_id: 21,
          resource_id: "resource-one",
          resource_title: "Project I",
          resource_slug: "project-i",
          version_number: 2,
          downloaded_at: "2026-07-18T00:00:00Z",
          total_count: 1,
        },
      ],
      error: null,
    });

    await expect(fetchDownloadHistory(2, 10)).resolves.toEqual({
      items: [
        {
          id: 21,
          resourceId: "resource-one",
          title: "Project I",
          slug: "project-i",
          versionNumber: 2,
          downloadedAt: "2026-07-18T00:00:00Z",
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
  });

  it("keeps mark-all-read idempotent when no unread rows remain", async () => {
    mocks.rpc.mockResolvedValue({ data: 0, error: null });
    await expect(markAllNotificationsRead()).resolves.toBe(0);
    await expect(markAllNotificationsRead()).resolves.toBe(0);
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
  });
});
