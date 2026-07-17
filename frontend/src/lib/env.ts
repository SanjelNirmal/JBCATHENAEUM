export const LATEST_DATABASE_MIGRATION = "202607170009_review_queue_scan_status";

type PublicEnvironmentSource = Record<string, string | boolean | undefined>;

export interface PublicEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appVersion: string;
  deployedAt: string;
  storageBucket: string;
}

export interface EnvironmentIssue {
  variable: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY";
  message: string;
}

export function validatePublicEnvironment(source: PublicEnvironmentSource): {
  config: PublicEnvironment;
  issues: EnvironmentIssue[];
} {
  const supabaseUrl = String(source.VITE_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(source.VITE_SUPABASE_ANON_KEY ?? "").trim();
  const issues: EnvironmentIssue[] = [];

  if (!supabaseUrl) {
    issues.push({
      variable: "VITE_SUPABASE_URL",
      message: "The public Supabase project URL is missing.",
    });
  } else {
    try {
      const parsedUrl = new URL(supabaseUrl);
      if (
        parsedUrl.protocol !== "https:" &&
        parsedUrl.hostname !== "localhost"
      ) {
        issues.push({
          variable: "VITE_SUPABASE_URL",
          message: "The project URL must use HTTPS outside local development.",
        });
      }
    } catch {
      issues.push({
        variable: "VITE_SUPABASE_URL",
        message: "The public Supabase project URL is invalid.",
      });
    }
  }

  if (!supabaseAnonKey) {
    issues.push({
      variable: "VITE_SUPABASE_ANON_KEY",
      message: "The public Supabase anonymous key is missing.",
    });
  }

  return {
    config: {
      supabaseUrl,
      supabaseAnonKey,
      appVersion: String(source.VITE_APP_VERSION ?? "unversioned"),
      deployedAt: String(source.VITE_DEPLOYED_AT ?? "not supplied"),
      storageBucket: String(source.VITE_RESOURCE_STORAGE_BUCKET ?? "").trim(),
    },
    issues,
  };
}

export const publicEnvironment = validatePublicEnvironment(import.meta.env);
