import { createClient } from "@midday/supabase/server";

export async function createApp(params: any) {
  const client = createClient();

  const { data, error } = await client.from("apps").insert(params).select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
