import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./client";
import { isAppRole, resolveEffectiveRole, type AppRole } from "../roles";
import type { AccountStatus } from "./database.types";
import { nativeAuthCallbackUrl, platformRuntime } from "../../platform";

export interface UserProfile {
  id: string;
  name: string;
  faculty: string;
  avatar_url: string | null;
  bio: string | null;
  account_status: AccountStatus;
  suspended_at: string | null;
  roles: AppRole[];
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  aal: "aal1" | "aal2" | null;
  emailVerified: boolean;
}

const PROFILE_COLUMNS =
  "id,name,faculty,avatar_url,bio,account_status,suspended_at,created_at,updated_at";

export async function fetchUserProfile(user: User): Promise<UserProfile> {
  const [
    { data: profile, error: profileError },
    { data: roleRows, error: roleError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);
  if (profileError) throw profileError;
  if (roleError) throw roleError;
  const roles = (roleRows ?? []).map((row) => row.role).filter(isAppRole);
  const normalizedRoles: AppRole[] = roles.length ? roles : ["student"];
  return {
    ...profile,
    faculty: profile.faculty ?? "Unspecified",
    account_status: profile.account_status ?? "active",
    roles: normalizedRoles,
    role: resolveEffectiveRole(normalizedRoles),
  } as UserProfile;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  let profile: UserProfile;
  try {
    profile = await fetchUserProfile(data.user);
  } catch (profileError) {
    // Do not leave a valid Auth session paired with an unusable application
    // profile. That partial state makes /login redirect away while the header
    // still appears signed out.
    await supabase.auth.signOut({ scope: "local" });
    throw profileError;
  }
  if (profile.account_status !== "active") {
    await supabase.auth.signOut();
    throw new Error(
      profile.account_status === "suspended"
        ? "account_suspended"
        : "account_disabled",
    );
  }
  return { user: data.user, profile };
}

function authCallbackUrl(
  next: string,
  type: "signup" | "recovery" | "magiclink" | "oauth",
): string {
  if (platformRuntime.isNative()) return nativeAuthCallbackUrl(next, type);
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", next);
  url.searchParams.set("type", type);
  return url.toString();
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  faculty: string,
) {
  const redirectTo = authCallbackUrl("/login?verified=1", "signup");
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: { name: name.trim(), faculty: faculty.trim() },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await import("../notifications/pushNotifications")
    .then(({ disablePushNotifications }) => disablePushNotifications())
    .catch(() => undefined);
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authCallbackUrl("/reset-password", "recovery"),
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function exchangeAuthCode(code: string) {
  if (!/^[A-Za-z0-9._~+/=-]{1,2048}$/.test(code))
    throw new Error("invalid_auth_callback");
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function waitForCurrentSession(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let session = await getCurrentSession();
  while (!session && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 150));
    session = await getCurrentSession();
  }
  return session;
}

export async function getAuthenticatorAssuranceLevel(): Promise<
  "aal1" | "aal2" | null
> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) return null;
  return data.currentLevel === "aal2"
    ? "aal2"
    : data.currentLevel === "aal1"
      ? "aal1"
      : null;
}

export async function enrollTotp() {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "JBC Athenaeum",
  });
  if (error) throw error;
  return data;
}

export async function verifyTotp(factorId: string, code: string) {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;
  const verification = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (verification.error) throw verification.error;
  return verification.data;
}

export async function challengeTotp(factorId: string, code: string) {
  return verifyTotp(factorId, code);
}

export async function listMfaFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    aal: null,
    emailVerified: false,
  });

  useEffect(() => {
    let active = true;
    const refresh = async (user: User | null) => {
      if (!active) return;
      if (!user) {
        setState({
          user: null,
          profile: null,
          loading: false,
          aal: null,
          emailVerified: false,
        });
        return;
      }
      try {
        const [profile, aal] = await Promise.all([
          fetchUserProfile(user),
          getAuthenticatorAssuranceLevel(),
        ]);
        if (profile.account_status !== "active") {
          await supabase.auth.signOut();
          return;
        }
        if (active)
          setState({
            user,
            profile,
            loading: false,
            aal,
            emailVerified: Boolean(user.email_confirmed_at),
          });
      } catch {
        if (active) {
          setState({
            user: null,
            profile: null,
            loading: false,
            aal: null,
            emailVerified: false,
          });
          // Clear a stale or incomplete local session so the user can return
          // to the login form and retry instead of being trapped in redirects.
          void supabase.auth.signOut({ scope: "local" });
        }
      }
    };

    void supabase.auth.getUser().then(({ data }) => refresh(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void refresh(session?.user ?? null);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  return state;
}
