import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const nativeBuild = mode === "native";
  // A fresh entry request per build prevents an old Cloudflare fallback
  // response from shadowing the real application entry when identical source
  // is rebuilt. The underlying hashed asset remains available to Workbox.
  const entryBuildId = Date.now().toString(36);

  const environment = loadEnv(
    mode,
    process.cwd(),
    "VITE_FIREBASE_",
  );

  const firebaseConfig = {
    apiKey: environment.VITE_FIREBASE_API_KEY || "",
    authDomain: environment.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: environment.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket:
      environment.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId:
      environment.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: environment.VITE_FIREBASE_APP_ID || "",
  };

  const firebaseWorkerConfig: Plugin = {
    name: "jbc-firebase-worker-config",

    generateBundle() {
      if (nativeBuild) return;

      this.emitFile({
        type: "asset",
        fileName: "firebase-config.js",
        source: `self.__JBC_FIREBASE_CONFIG__=${JSON.stringify(
          firebaseConfig,
        )};`,
      });
    },
  };

  const entryCacheBuster: Plugin = {
    name: "jbc-entry-cache-buster",
    enforce: "post",

    transformIndexHtml(html) {
      if (nativeBuild) return html;

      return html.replace(
        /(<script\b[^>]*\bsrc="\/assets\/[^"]+\.js)"/,
        `$1?__jbc_build=${entryBuildId}"`,
      );
    },
  };

  return {
    plugins: [
      react(),
      tailwindcss(),
      firebaseWorkerConfig,
      entryCacheBuster,

      VitePWA({
        // Native WebView bundles do not need a service worker.
        disable: nativeBuild,

        // Automatically activate new deployments.
        registerType: "autoUpdate",

        // Automatically inject service-worker registration.
        injectRegister: "auto",

        manifest: false,

        workbox: {
          importScripts: ["firebase-messaging-sw.js"],

          // Disable vite-plugin-pwa's default precached index NavigationRoute;
          // it would otherwise run before the NetworkFirst rule below.
          navigateFallback: "",

          // Immediately activate the latest service worker.
          skipWaiting: true,
          clientsClaim: true,

          // Remove caches belonging to old deployments.
          cleanupOutdatedCaches: true,

          // The HTML entry uses this per-build cache key. Ignoring it lets the
          // active worker satisfy later offline loads from the precache.
          ignoreURLParametersMatching: [/^__jbc_build$/],

          globPatterns: [
            "**/*.{js,css,html,png,jpg,jpeg,svg,ico,mp3,woff,woff2}",
          ],

          globIgnores: [
            "**/*.pdf",
            "payment/**",
            "**/firebase-config.js",
          ],

          runtimeCaching: [
            {
              // Always get page navigation from the latest deployment.
              urlPattern: ({ request }) =>
                request.mode === "navigate",

              handler: "NetworkFirst",

              options: {
                cacheName: "jbc-navigation-v1",
                networkTimeoutSeconds: 4,

                cacheableResponse: {
                  statuses: [0, 200],
                },

                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60,
                },

                // If both the network and a previously cached navigation are
                // unavailable, show the precached offline document.
                precacheFallback: {
                  fallbackURL: "/offline.html",
                },
              },
            },

            {
              urlPattern: /\/auth\/v1\//,
              handler: "NetworkOnly",
            },

            {
              urlPattern: /\/rest\/v1\//,
              handler: "NetworkOnly",
            },

            {
              urlPattern: /\/functions\/v1\//,
              handler: "NetworkOnly",
            },

            {
              urlPattern: /\/storage\/v1\/object\//,
              handler: "NetworkOnly",
            },

            {
              urlPattern:
                /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,

              handler: "CacheFirst",

              options: {
                cacheName: "jbc-public-fonts-v1",

                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 31_536_000,
                },

                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },

        devOptions: {
          enabled: false,
        },
      }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== "true",

      watch:
        process.env.DISABLE_HMR === "true"
          ? null
          : {},
    },

    test: {
      environment: "happy-dom",

      include: [
        "src/**/*.{test,spec}.{ts,tsx}",
      ],

      setupFiles: [
        "src/test/setup.ts",
      ],

      coverage: {
        provider: "v8",

        include: [
          "src/**/*.{ts,tsx}",
        ],

        exclude: [
          "src/main.tsx",
          "src/vite-env.d.ts",
        ],
      },
    },

  };
});
