export type NotificationPreferenceRecord = Record<string, unknown>;

export function isQuietHoursActive(
  preference: NotificationPreferenceRecord,
  now = new Date(),
): boolean {
  if (
    preference.quiet_hours_enabled !== true ||
    typeof preference.quiet_hours_start !== "string" ||
    typeof preference.quiet_hours_end !== "string"
  ) {
    return false;
  }
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: typeof preference.timezone === "string" ? preference.timezone : "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const current = `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
    const start = preference.quiet_hours_start.slice(0, 5);
    const end = preference.quiet_hours_end.slice(0, 5);
    return start <= end
      ? current >= start && current < end
      : current >= start || current < end;
  } catch {
    return false;
  }
}

export function categoryEnabled(
  category: string,
  preference: NotificationPreferenceRecord,
): boolean {
  if (category === "administrative_announcement") return preference.system_announcements === true;
  if (category === "past_question") return preference.past_questions === true;
  if (category === "account_security") return preference.account_security === true;
  if (category === "new_resource") return preference.new_resources === true;
  return preference.resource_updates === true;
}

export function deliveryAllowed(
  category: string,
  preference: NotificationPreferenceRecord,
  now = new Date(),
): boolean {
  if (preference.push_enabled !== true || !categoryEnabled(category, preference)) return false;
  return category === "account_security" || !isQuietHoursActive(preference, now);
}

export function isInvalidFcmTokenError(code: string, message: string): boolean {
  return ["UNREGISTERED", "INVALID_ARGUMENT", "NOT_FOUND"].includes(code) ||
    /registration token|unregistered/i.test(message);
}
