import { Database } from "@/supabase-types";
import { client } from "@/trigger";
import { SupabaseManagement } from "@trigger.dev/supabase";

const supabaseManagement = new SupabaseManagement({
  id: "supabase-management",
  apiKey: process.env.SUPABASE_API_KEY!,
});

const db = supabaseManagement.db<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
);

client.defineJob({
  id: "transactions-job",
  name: "Transactions",
  version: "0.0.1",
  trigger: db.onInserted({
    table: "bank_accounts",
  }),
  run: async (payload, io, ctx) => {},
});
