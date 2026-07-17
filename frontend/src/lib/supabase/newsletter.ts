import { supabase } from "./client";
export async function subscribeToNewsletter(email: string) {
  const { data, error } = await supabase.rpc("subscribe_to_newsletter", {
    subscriber_email: email.trim(),
  });
  if (error) throw error;
  return data;
}
export async function fetchSubscribers() {
  const { data, error } = await supabase
    .from("newsletter_subscriptions")
    .select("id,email,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}
