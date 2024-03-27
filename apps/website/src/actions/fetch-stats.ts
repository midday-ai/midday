"use server";

import { createClient } from "@midday/supabase/server";

export async function fetchStats() {
  const supabase = createClient();

  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact" });

  return count;
}
