/* global firebase */

/*
 * Firebase Messaging is imported into the single root-scoped
 * Workbox service worker.
 *
 * Do not register firebase-messaging-sw.js as a separate service worker.
 *
 * The Vite build imports this file into sw.js.
 *
 * firebase-config.js contains only Firebase client configuration generated
 * from VITE_FIREBASE_* environment variables.
 */

importScripts("/firebase-config.js");

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js",
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js",
);

const config =
  self.__JBC_FIREBASE_CONFIG__;

if (
  config &&
  config.apiKey &&
  config.projectId &&
  !firebase.apps.length
) {
  firebase.initializeApp(config);

  const messaging =
    firebase.messaging();

  /*
   * Web notifications are sent as data-only FCM messages.
   *
   * This handler runs when:
   * - the page is in the background;
   * - the browser tab is closed;
   * - the installed PWA is not currently open;
   * - the service worker is started by an incoming push.
   */
  messaging.onBackgroundMessage(
    async (payload) => {
      const data =
        payload.data || {};

      const destination =
        safeDestination(
          data.url,
        );

      const notificationId =
        typeof data.notificationId === "string"
          ? data.notificationId.slice(0, 160)
          : "";

      const tagCandidate =
        typeof data.tag === "string"
          ? data.tag.trim().slice(0, 160)
          : notificationId;

      const tag = /^[a-zA-Z0-9:_-]+$/.test(tagCandidate)
        ? tagCandidate
        : undefined;

      if (notificationId) {
        const displayed = await self.registration.getNotifications();
        if (
          displayed.some(
            (notification) =>
              notification.data?.notificationId === notificationId,
          )
        ) {
          return;
        }
      }

      const timestamp =
        Number(
          data.timestamp,
        );

      const notificationOptions =
        {
          body:
            data.body ||
            "A new academic update is available.",

          icon:
            data.icon ||
            "/icons/icon-192.png",

          badge:
            data.badge ||
            "/icons/badge-96.png",

          /*
           * A tag allows related notifications to replace one another.
           * renotify requests another alert when replacement occurs.
           */
          ...(tag ? { tag, renotify: true } : {}),

          /*
           * Request a normal operating-system notification.
           * The browser and operating system still control whether
           * a sound actually plays.
           */
          silent: false,

          /*
           * Supported mainly on Android.
           * Desktop browsers may ignore vibration settings.
           */
          vibrate: [
            200,
            100,
            200,
          ],

          timestamp:
            Number.isFinite(
              timestamp,
            )
              ? timestamp
              : Date.now(),

          requireInteraction:
            data.requireInteraction ===
            "true",

          data: {
            url:
              destination,

            resourceId:
              data.resourceId ||
              "",

            notificationId:
              notificationId,

            category:
              data.category ||
              "",
          },
        };

      return self.registration
        .showNotification(
          data.title ||
            "JBC Athenaeum",
          notificationOptions,
        );
    },
  );
}

/**
 * Only permit internal JBC Athenaeum routes.
 *
 * External URLs and malformed values are replaced with /resources.
 */
function safeDestination(
  value,
) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\r\n]/.test(value)
  ) {
    return "/resources";
  }
  try {
    const url = new URL(
      value || "/resources",
      self.location.origin,
    );

    if (
      url.origin !==
      self.location.origin
    ) {
      return "/resources";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/resources";
  }
}

/**
 * Focus an existing JBC Athenaeum window when possible.
 * Otherwise open a new window.
 */
self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const destination =
      safeDestination(
        event.notification
          .data?.url,
      );

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled:
            true,
        })
        .then(
          async (
            windowClients,
          ) => {
            for (
              const client of
              windowClients
            ) {
              const clientUrl =
                new URL(
                  client.url,
                );

              if (
                clientUrl.origin ===
                self.location
                  .origin
              ) {
                await client.focus();

                if (
                  "navigate" in
                  client
                ) {
                  await client.navigate(
                    destination,
                  );
                }

                return;
              }
            }

            return self.clients
              .openWindow(
                destination,
              );
          },
        ),
    );
  },
);

/*
 * Close notifications automatically when a notification-close event occurs.
 * This listener is optional but useful for future analytics.
 */
self.addEventListener("notificationclose", () => undefined);
