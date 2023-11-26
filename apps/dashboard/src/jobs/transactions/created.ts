import { client } from "@/trigger";
import { supabaseTriggers } from "../client";
import { scheduler } from "./scheduler";

client.defineJob({
  id: "bank-account-created",
  name: "🏦 Bank Account Created",
  version: "1.0.1",
  trigger: supabaseTriggers.onInserted({
    table: "bank_accounts",
  }),
  run: async (payload, io) => {
    await io.sendEvent("🔂 Transactions Initial Sync", {
      id: payload.record.id,
      name: "transactions.initial.sync",
      payload: {
        accountId: payload.record.account_id,
        teamId: payload.record.team_id,
        recordId: payload.record.id,
      },
    });

    // use the bank account row id as the id for the DynamicSchedule
    // so it comes through to run() in the context source.id
    await scheduler.register(payload.record.id, {
      type: "interval",
      options: {
        seconds: 60 * 10, // every 1h
      },
    });
  },
});
