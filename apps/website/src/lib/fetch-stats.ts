"use server";

import type { Database } from "@midday/supabase/types";
import { createServerClient } from "@supabase/ssr";

export async function fetchStats() {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          return null;
        },
        remove() {
          return null;
        },
      },
    },
  );

  const supabaseStorage = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get() {
          return null;
        },
        set() {
          return null;
        },
        remove() {
          return null;
        },
      },
      db: { schema: "storage" },
    },
  );

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
    { count: invoices },
    { count: invoiceCustomers },
  ] = await Promise.all([
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
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .limit(1),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .limit(1),
  ]);

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
    invoices,
    invoiceCustomers,
  };
}
