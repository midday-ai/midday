"use server";

import { createClient } from "@midday/supabase/server";

export async function fetchStats() {
  const supabase = createClient({ admin: true });

  const { count: users } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .limit(1);

  const { count: transactions } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .limit(1);

  return { users, transactions };
}
