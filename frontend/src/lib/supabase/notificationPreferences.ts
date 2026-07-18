import { supabase } from "./client";
import { requireCurrentUserId } from "./currentUser";

export interface NotificationPreferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  submissionUpdates: boolean;
  resourceUpdates: boolean;
  moderationUpdates: boolean;
  systemAnnouncements: boolean;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  inAppEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  submissionUpdates: true,
  resourceUpdates: true,
  moderationUpdates: true,
  systemAnnouncements: true,
};

function mapPreferences(row: {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  submission_updates: boolean;
  resource_updates: boolean;
  moderation_updates: boolean;
  system_announcements: boolean;
}): NotificationPreferences {
  return {
    inAppEnabled: row.in_app_enabled,
    emailEnabled: row.email_enabled,
    pushEnabled: row.push_enabled,
    submissionUpdates: row.submission_updates,
    resourceUpdates: row.resource_updates,
    moderationUpdates: row.moderation_updates,
    systemAnnouncements: row.system_announcements,
  };
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      "in_app_enabled,email_enabled,push_enabled,submission_updates,resource_updates,moderation_updates,system_announcements",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return mapPreferences(data);
  return saveNotificationPreferences(defaultNotificationPreferences);
}

export async function saveNotificationPreferences(
  input: NotificationPreferences,
): Promise<NotificationPreferences> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: userId,
        in_app_enabled: input.inAppEnabled,
        email_enabled: input.emailEnabled,
        push_enabled: input.pushEnabled,
        submission_updates: input.submissionUpdates,
        resource_updates: input.resourceUpdates,
        moderation_updates: input.moderationUpdates,
        system_announcements: input.systemAnnouncements,
      },
      { onConflict: "user_id" },
    )
    .select(
      "in_app_enabled,email_enabled,push_enabled,submission_updates,resource_updates,moderation_updates,system_announcements",
    )
    .single();
  if (error) throw error;
  return mapPreferences(data);
}
