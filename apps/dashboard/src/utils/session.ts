import { createClient } from "@midday/supabase/client";

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token ?? null;
}
