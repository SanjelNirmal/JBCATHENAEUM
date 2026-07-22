export type PushPlatform = "web" | "android" | "ios";

export interface PushPayloadInput {
  token: string;
  platform: PushPlatform;
  title: string;
  body: string;
  url: string;
  notificationId: string;
  resourceId: string;
  category: string;
  timestamp: string;
  important: boolean;
}

export function buildFcmMessage(input: PushPayloadInput): Record<string, unknown> {
  const data: Record<string, string> = {
    title: input.title,
    body: input.body,
    url: input.url,
    notificationId: input.notificationId,
    resourceId: input.resourceId,
    category: input.category,
    timestamp: input.timestamp,
    tag: input.resourceId
      ? `resource-${input.resourceId}`
      : `notification-${input.notificationId}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    requireInteraction: input.important ? "true" : "false",
  };

  if (input.platform === "web") {
    return {
      token: input.token,
      data,
      webpush: {
        headers: {
          Urgency: input.important ? "high" : "normal",
          TTL: input.important ? "86400" : "604800",
        },
      },
    };
  }

  if (input.platform === "android") {
    return {
      token: input.token,
      notification: { title: input.title, body: input.body },
      data,
      android: {
        priority: input.important ? "high" : "normal",
        ttl: input.important ? "86400s" : "604800s",
        notification: {
          channel_id: "academic_updates",
          click_action: "FCM_PLUGIN_ACTIVITY",
          sound: "default",
          default_vibrate_timings: true,
        },
      },
    };
  }

  return {
    token: input.token,
    notification: { title: input.title, body: input.body },
    data,
    apns: {
      headers: {
        "apns-priority": input.important ? "10" : "5",
        "apns-expiration": String(
          Math.floor(Date.now() / 1_000) + (input.important ? 86_400 : 604_800),
        ),
      },
      payload: {
        aps: {
          sound: "default",
          badge: 1,
          "mutable-content": 1,
        },
      },
    },
  };
}
