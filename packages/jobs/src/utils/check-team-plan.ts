import { createClient } from "@midday/supabase/job";

export async function shouldSendEmail(teamId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("teams")
    .select("id, plan, subscription_status")
    .eq("id", teamId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return false;
  }

  return data.plan === "trial" || data.subscription_status === "trialing";
}
