"use server";

import { createClient } from "@midday/supabase/server";
import { unstable_cache } from "next/cache";

export async function fetchStats() {
  const supabase = createClient({ admin: true });
  const supabaseStorage = createClient({
    admin: true,
    db: { schema: "storage" },
  });

  const [
    { count: users },
    { count: transactions },
    { count: bankAccounts },
    { count: trackerEntries },
    { count: inboxItems },
    { count: bankConnections },
    { count: trackerProjects },
    { count: reports },
    { count: vaultObjects },
    { count: transactionEnrichments },
  ] = await unstable_cache(
    async () => {
      return Promise.all([
        supabase
          .from("teams")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("transactions")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("bank_accounts")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("tracker_entries")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("inbox")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("bank_connections")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("tracker_projects")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabaseStorage
          .from("objects")
          .select("id", { count: "exact", head: true })
          .limit(1),
        supabase
          .from("transaction_enrichments")
          .select("id", { count: "exact", head: true })
          .limit(1),
      ]);
    },
    ["stats"],
    {
      revalidate: 800,
      tags: ["stats"],
    },
  )();

  return {
    users,
    transactions,
    bankAccounts,
    trackerEntries,
    inboxItems,
    bankConnections,
    trackerProjects,
    reports,
    vaultObjects,
    transactionEnrichments,
  };
}
