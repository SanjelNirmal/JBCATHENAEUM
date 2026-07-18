import { createClient } from "@supabase/supabase-js";
import { publicEnvironment } from "../env";
import type { Database } from "./database.types";

const safeUrl =
  publicEnvironment.config.supabaseUrl ||
  "https://configuration-required.invalid";
const safeKey =
  publicEnvironment.config.supabaseAnonKey || "configuration-required";

export const supabase = createClient<Database>(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export const LATEST_DATABASE_MIGRATION =
  "202607180014_manual_pdf_review_only";
