import { Job } from "@trigger.dev/sdk";
import { SupabaseManagement } from "@trigger.dev/supabase";
import { client } from "./client";

const supabase = new SupabaseManagement({
  id: "supabase-oauth",
});
// console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

const db = supabase.db("https://service.midday.ai");

// client.defineJob({
//   id: "transactions-job",
//   name: "Transactions",
//   version: "0.0.1",
//   enabled: true,
//   trigger: db.onInserted({
//     table: "bank_accounts",
//   }),
//   run: async (payload, io, ctx) => {
//     console.log("here");
//   },
// });

// client.defineJob({
//   id: "supabase-trigger",
//   name: "Supabase Trigger",
//   version: "1.0.0",
//   trigger: db.onInserted({
//     table: "bank_accounts",
//   }),
//   run: async (payload, io, ctx) => {
//     // payload.record and payload.old_record are now correctly typed to match the todos table
//   },
// });

new Job(client, {
  id: "on-new-todos",
  name: "On New Todos",
  version: "0.1.1",
  trigger: db.onInserted({
    table: "bank_accounts",
  }),
  run: async (payload, io, ctx) => {},
});

client.defineJob({
  id: "supabase-trigger",
  name: "Supabase Trigger",
  version: "1.0.0",
  trigger: db.onInserted({
    table: "todos",
  }),
  run: async (payload, io, ctx) => {
    // payload is the database webhook body (see https://supabase.com/docs/guides/database/webhooks#payload)
  },
});
