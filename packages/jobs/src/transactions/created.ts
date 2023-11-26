import { client, supabaseTriggers } from "@/client";
import { Events, Jobs } from "../constants";
import { scheduler } from "./scheduler";

client.defineJob({
  id: Jobs.BANK_ACCOUNT_CREATED,
  name: "🏦 Bank Account Created",
  version: "1.0.1",
  trigger: supabaseTriggers.onInserted({
    table: "bank_accounts",
  }),
  run: async (payload, io) => {
    await io.sendEvent("🔂 Transactions Initial Sync", {
      id: payload.record.id,
      name: Events.TRANSACTIONS_INITIAL_SYNC,
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
