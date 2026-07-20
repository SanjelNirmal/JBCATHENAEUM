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
  newResources: boolean;
  pastQuestions: boolean;
  accountSecurity: boolean;
  programId: string | null;
  termId: string | null;
  subjectIds: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string | null;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  inAppEnabled: true,
  emailEnabled: true,
  pushEnabled: false,
  submissionUpdates: true,
  resourceUpdates: true,
  moderationUpdates: true,
  systemAnnouncements: true,
  newResources: true,
  pastQuestions: true,
  accountSecurity: true,
  programId: null,
  termId: null,
  subjectIds: [],
  quietHoursEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
};

function mapPreferences(row: {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  submission_updates: boolean;
  resource_updates: boolean;
  moderation_updates: boolean;
  system_announcements: boolean;
  new_resources: boolean;
  past_questions: boolean;
  account_security: boolean;
  program_id: string | null;
  term_id: string | null;
  subject_ids: string[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string | null;
}): NotificationPreferences {
  return {
    inAppEnabled: row.in_app_enabled,
    emailEnabled: row.email_enabled,
    pushEnabled: row.push_enabled,
    submissionUpdates: row.submission_updates,
    resourceUpdates: row.resource_updates,
    moderationUpdates: row.moderation_updates,
    systemAnnouncements: row.system_announcements,
    newResources: row.new_resources,
    pastQuestions: row.past_questions,
    accountSecurity: row.account_security,
    programId: row.program_id,
    termId: row.term_id,
    subjectIds: row.subject_ids,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    timezone: row.timezone,
  };
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      "in_app_enabled,email_enabled,push_enabled,submission_updates,resource_updates,moderation_updates,system_announcements,new_resources,past_questions,account_security,program_id,term_id,subject_ids,quiet_hours_enabled,quiet_hours_start,quiet_hours_end,timezone",
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
        new_resources: input.newResources,
        past_questions: input.pastQuestions,
        account_security: input.accountSecurity,
        program_id: input.programId,
        term_id: input.termId,
        subject_ids: input.subjectIds,
        quiet_hours_enabled: input.quietHoursEnabled,
        quiet_hours_start: input.quietHoursEnabled ? input.quietHoursStart : null,
        quiet_hours_end: input.quietHoursEnabled ? input.quietHoursEnd : null,
        timezone: input.timezone,
      },
      { onConflict: "user_id" },
    )
    .select(
      "in_app_enabled,email_enabled,push_enabled,submission_updates,resource_updates,moderation_updates,system_announcements,new_resources,past_questions,account_security,program_id,term_id,subject_ids,quiet_hours_enabled,quiet_hours_start,quiet_hours_end,timezone",
    )
    .single();
  if (error) throw error;
  return mapPreferences(data);
}
