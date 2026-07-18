export type ErrorContext =
  "auth" | "upload" | "review" | "resource" | "network" | "default";

const codeMessages: Record<string, string> = {
  "42501": "You do not have permission to perform this action.",
  "23505": "This item already exists.",
  "23514": "This action is not valid for the current state.",
  P0002: "The requested item could not be found.",
  authentication_required: "Please sign in to continue.",
  invalid_credentials: "The email or password is incorrect.",
  email_not_confirmed: "Verify your email address before signing in.",
  email_address_not_authorized:
    "Password recovery email delivery is not configured for this address. Contact the site administrator.",
  email_provider_disabled:
    "Email authentication is currently unavailable. Contact the site administrator.",
  over_email_send_rate_limit:
    "Too many recovery emails have been requested. Wait before trying again.",
  over_request_rate_limit:
    "Too many authentication requests were made. Wait a few minutes and try again.",
  request_timeout: "The authentication request timed out. Please try again.",
  captcha_failed:
    "The security check could not be verified. Refresh the page and try again.",
  weak_password:
    "Use a stronger password that meets all password requirements.",
  same_password: "Choose a password different from your current password.",
  "avatar url must start with https://": "Avatar URL must start with https://.",
  mfa_required: "Multi-factor authentication is required for this action.",
  account_suspended:
    "This account is suspended. Contact a campus administrator for assistance.",
  account_disabled:
    "This account is disabled. Contact a campus administrator for assistance.",
  invalid_session: "The upload session is missing. Start the upload again.",
  expired_session: "The upload session expired. Start the upload again.",
  upload_missing:
    "The transferred file was not found in private Storage. Retry the upload.",
  size_mismatch:
    "The transferred file size did not match the selected file. Retry the upload.",
  policy_acceptance_required:
    "Confirm the current Upload Policy before uploading.",
  internal_error:
    "The upload service could not complete the request. Check the deployed database migration and Edge Function logs.",
};

export function getErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  )
    return error.code;
  return "";
}

export function toSafeErrorMessage(
  error: unknown,
  context: ErrorContext = "default",
): string {
  const code = getErrorCode(error);
  if (codeMessages[code]) return codeMessages[code];
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("invalid login credentials"))
    return codeMessages.invalid_credentials;
  if (message.includes("email not confirmed"))
    return codeMessages.email_not_confirmed;
  if (message.includes("authentication_required"))
    return codeMessages.authentication_required;
  if (message.includes("avatar url must start with https://"))
    return codeMessages["avatar url must start with https://"];
  if (message.includes("multi-factor") || message.includes("aal2"))
    return codeMessages.mfa_required;
  if (
    message.includes("account_suspended") ||
    message.includes("account suspended")
  )
    return codeMessages.account_suspended;
  if (
    message.includes("account_disabled") ||
    message.includes("account disabled") ||
    message.includes("account inactive")
  )
    return codeMessages.account_disabled;
  if (message.includes("failed to fetch") || message.includes("network"))
    return "The network request failed. Check your connection and try again.";
  const fallbacks: Record<ErrorContext, string> = {
    auth: "Authentication could not be completed. Please try again.",
    upload:
      "The upload could not be completed. Your file has not been published.",
    review: "The review action could not be completed.",
    resource: "The resource could not be loaded.",
    network: "The network request failed. Please try again.",
    default: "Something went wrong. Please try again.",
  };
  return fallbacks[context];
}
