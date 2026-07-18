export const LATEST_DATABASE_MIGRATION = "202607180016_bca_old_new_curricula";

type PublicEnvironmentSource = Record<string, string | boolean | undefined>;

export interface PublicEnvironment {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appVersion: string;
  deployedAt: string;
  storageBucket: string;
  publicAppUrl: string;
  environmentName: "development" | "preview" | "production";
  nativeExternalPaymentsEnabled: boolean;
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
  const configuredPublicAppUrl = String(
    source.VITE_PUBLIC_APP_URL ?? "https://jbc.nirmalsanjel.com.np",
  ).trim();
  const configuredEnvironment = String(
    source.VITE_PUBLIC_ENVIRONMENT ?? "development",
  ).trim();
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

  let publicAppUrl = "https://jbc.nirmalsanjel.com.np";
  try {
    const parsedUrl = new URL(configuredPublicAppUrl);
    if (
      parsedUrl.protocol === "https:" &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      publicAppUrl = parsedUrl.origin;
    }
  } catch {
    // Fall back to the production public origin. This value is client-safe and
    // prevents native share sheets from ever exposing capacitor:// URLs.
  }
  const environmentName = ["development", "preview", "production"].includes(
    configuredEnvironment,
  )
    ? (configuredEnvironment as PublicEnvironment["environmentName"])
    : "development";

  return {
    config: {
      supabaseUrl,
      supabaseAnonKey,
      appVersion: String(source.VITE_APP_VERSION ?? "unversioned"),
      deployedAt: String(source.VITE_DEPLOYED_AT ?? "not supplied"),
      storageBucket: String(source.VITE_RESOURCE_STORAGE_BUCKET ?? "").trim(),
      publicAppUrl,
      environmentName,
      nativeExternalPaymentsEnabled:
        String(source.VITE_NATIVE_EXTERNAL_PAYMENTS_ENABLED ?? "false") ===
        "true",
    },
    issues,
  };
}

export const publicEnvironment = validatePublicEnvironment(import.meta.env);
