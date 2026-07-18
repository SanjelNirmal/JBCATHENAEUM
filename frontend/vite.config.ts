import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const nativeBuild = mode === "native";
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Keep the web/PWA build unchanged, but do not generate a service
        // worker for the native WebView bundle. Native assets ship with the
        // application and private API/document responses remain network-only.
        disable: nativeBuild,
        registerType: "prompt",
        injectRegister: false,
        manifest: false,
        workbox: {
          navigateFallback: "index.html",
          globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,ico,woff2}"],
          globIgnores: ["**/*.pdf", "payment/**"],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
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
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,
              handler: "CacheFirst",
              options: {
                cacheName: "jbc-public-fonts-v1",
                expiration: { maxEntries: 12, maxAgeSeconds: 31_536_000 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
    test: {
      environment: "happy-dom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      setupFiles: ["src/test/setup.ts"],
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/main.tsx", "src/vite-env.d.ts"],
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("@tanstack")) return "query";
            if (id.includes("react-router")) return "router";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("react") || id.includes("scheduler"))
              return "react";
            return "vendor";
          },
        },
      },
    },
  };
});
