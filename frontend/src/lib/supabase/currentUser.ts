import { supabase } from "./client";

export async function requireCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("authentication_required");
  return data.user.id;
}
