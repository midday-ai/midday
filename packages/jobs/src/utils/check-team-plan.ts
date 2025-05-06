import { createClient } from "@midday/supabase/job";

export async function shouldSendEmail(teamId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("plan", "trial")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return true;
  }

  return false;
}
