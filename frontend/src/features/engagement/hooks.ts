import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBookmark,
  deleteBookmark,
  fetchBookmarks,
  fetchBookmarkState,
} from "../../lib/supabase/bookmarks";
import {
  deleteRating,
  fetchOwnRating,
  fetchRatingSummary,
  saveRating,
} from "../../lib/supabase/ratings";
import { fetchDownloadHistory } from "../../lib/supabase/downloadHistory";
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "../../lib/supabase/notificationPreferences";
import { fetchPublicResourceRatings } from "../../lib/supabase/resources";
import {
  fetchUserDevices,
  registerUserDevice,
  removeUserDevice,
  type DeviceRegistration,
} from "../../lib/supabase/devices";

export const engagementKeys = {
  bookmark: (userId: string | undefined, resourceId: string) =>
    ["bookmark", userId, resourceId] as const,
  bookmarks: (userId: string | undefined) => ["bookmarks", userId] as const,
  rating: (userId: string | undefined, resourceId: string) =>
    ["resource-rating", userId, resourceId] as const,
  ratingSummary: (resourceId: string) =>
    ["resource-rating-summary", resourceId] as const,
  downloads: (userId: string | undefined) =>
    ["download-history", userId] as const,
  preferences: (userId: string | undefined) =>
    ["notification-preferences", userId] as const,
  devices: (userId: string | undefined) => ["user-devices", userId] as const,
};

export function useResourceBookmark(
  resourceId: string,
  userId: string | undefined,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: engagementKeys.bookmark(userId, resourceId),
    queryFn: () => fetchBookmarkState(resourceId),
    enabled: Boolean(userId && resourceId),
  });
  const mutation = useMutation({
    mutationFn: async (nextBookmarked: boolean) => {
      if (nextBookmarked) await createBookmark(resourceId);
      else await deleteBookmark(resourceId);
      return nextBookmarked;
    },
    onSuccess: async (nextBookmarked) => {
      client.setQueryData(
        engagementKeys.bookmark(userId, resourceId),
        nextBookmarked,
      );
      await client.invalidateQueries({
        queryKey: engagementKeys.bookmarks(userId),
      });
    },
  });
  return { ...query, toggle: mutation.mutateAsync, mutation };
}

export function useBookmarks(
  userId: string | undefined,
  page: number,
  pageSize = 12,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...engagementKeys.bookmarks(userId), page, pageSize],
    queryFn: () => fetchBookmarks(page, pageSize),
    enabled: Boolean(userId),
  });
  const remove = useMutation({
    mutationFn: (resourceId: string) => deleteBookmark(resourceId),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: engagementKeys.bookmarks(userId) }),
  });
  return { ...query, remove };
}

export function useResourceRatings(
  resourceId: string,
  userId: string | undefined,
) {
  const client = useQueryClient();
  const summary = useQuery({
    queryKey: engagementKeys.ratingSummary(resourceId),
    queryFn: () => fetchRatingSummary(resourceId),
    enabled: Boolean(resourceId),
  });
  const own = useQuery({
    queryKey: engagementKeys.rating(userId, resourceId),
    queryFn: () => fetchOwnRating(resourceId),
    enabled: Boolean(userId && resourceId),
  });
  const publicRatings = useQuery({
    queryKey: ["public-resource-ratings", resourceId] as const,
    queryFn: () => fetchPublicResourceRatings(resourceId),
    enabled: Boolean(resourceId),
  });
  const save = useMutation({
    mutationFn: (input: { rating: number; reviewText: string }) =>
      saveRating(resourceId, input.rating, input.reviewText),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: engagementKeys.rating(userId, resourceId),
        }),
        client.invalidateQueries({
          queryKey: engagementKeys.ratingSummary(resourceId),
        }),
      ]);
    },
  });
  const remove = useMutation({
    mutationFn: () => deleteRating(resourceId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({
          queryKey: engagementKeys.rating(userId, resourceId),
        }),
        client.invalidateQueries({
          queryKey: engagementKeys.ratingSummary(resourceId),
        }),
      ]);
    },
  });
  return { summary, own, publicRatings, save, remove };
}

export function useDownloadHistory(
  userId: string | undefined,
  page: number,
  pageSize = 20,
) {
  return useQuery({
    queryKey: [...engagementKeys.downloads(userId), page, pageSize],
    queryFn: () => fetchDownloadHistory(page, pageSize),
    enabled: Boolean(userId),
  });
}

export function useNotificationPreferences(userId: string | undefined) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: engagementKeys.preferences(userId),
    queryFn: fetchNotificationPreferences,
    enabled: Boolean(userId),
  });
  const mutation = useMutation({
    mutationFn: (input: NotificationPreferences) =>
      saveNotificationPreferences(input),
    onSuccess: (data) => {
      client.setQueryData(engagementKeys.preferences(userId), data);
    },
  });
  return { ...query, save: mutation.mutateAsync, mutation };
}

export function useUserDevices(userId: string | undefined) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: engagementKeys.devices(userId),
    queryFn: fetchUserDevices,
    enabled: Boolean(userId),
  });
  const register = useMutation({
    mutationFn: (input: DeviceRegistration) => registerUserDevice(input),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: engagementKeys.devices(userId) }),
  });
  const remove = useMutation({
    mutationFn: (deviceId: string) => removeUserDevice(deviceId),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: engagementKeys.devices(userId) }),
  });
  return { ...query, register, remove };
}
