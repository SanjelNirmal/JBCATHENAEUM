// Copyright by nirmal sanjel | hackingwithnirmal@gmail.com | +977 9848744321
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { AuthProvider } from "./app/AuthContext.tsx";
import { ConfigurationErrorScreen } from "./components/ConfigurationErrorScreen.tsx";
import { publicEnvironment } from "./lib/env.ts";
import { queryClient } from "./lib/supabase/queryClient.ts";
import "./index.css";
import { initializeClientMonitoring } from "./lib/monitoring.ts";

initializeClientMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {publicEnvironment.issues.length > 0 ? (
      <ConfigurationErrorScreen issues={publicEnvironment.issues} />
    ) : (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    )}
  </StrictMode>,
);
