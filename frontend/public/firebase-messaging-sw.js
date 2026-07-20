/* Firebase is imported into the one root-scoped Workbox worker. Do not register
 * this file as a second service worker. The config asset is emitted by Vite
 * from VITE_FIREBASE_* values and contains client configuration only. */
importScripts("/firebase-config.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

const config = self.__JBC_FIREBASE_CONFIG__;
if (config && config.apiKey && config.projectId && !firebase.apps.length) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  // Data messages are displayed here for consistent deep links. FCM can
  // automatically display notification payloads, so those are not shown again.
  messaging.onBackgroundMessage((payload) => {
    if (payload.notification) return;
    const data = payload.data || {};
    const destination = safeDestination(data.url);
    return self.registration.showNotification(data.title || "JBC Athenaeum", {
      body: data.body || "A new academic update is available.",
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/badge-96.png",
      tag: data.tag || data.notificationId || undefined,
      timestamp: Number(data.timestamp) || Date.now(),
      data: {
        url: destination,
        resourceId: data.resourceId || "",
        notificationId: data.notificationId || "",
      },
    });
  });
}

function safeDestination(value) {
  try {
    const url = new URL(value || "/resources", self.location.origin);
    return url.origin === self.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/resources";
  } catch {
    return "/resources";
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = safeDestination(event.notification.data?.url);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ("navigate" in client) await client.navigate(destination);
          return;
        }
      }
      return self.clients.openWindow(destination);
    }),
  );
});
