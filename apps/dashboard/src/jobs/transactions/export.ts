import { client } from "@/trigger";
import { getTransactionsQuery } from "@midday/supabase/queries";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { supabase } from "../client";

client.defineJob({
  id: "transactions-export",
  name: "Transactions - Export",
  version: "1.0.1",
  trigger: eventTrigger({
    name: "transactions.export",
    schema: z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { from, to, teamId } = payload;

    const client = await io.supabase.client;

    const generateExport = await io.createStatus("generate-export-start", {
      label: "Generating export",
      state: "loading",
    });

    await io.logger.info("Transactions Export");

    const data = await getTransactionsQuery(client, {
      teamId,
      from: 0,
      to: 100000,
      filter: {
        date: {
          from: from.toDateString(),
          to: to.toDateString(),
        },
      },
    });

    await io.logger.info(`Transactions: ${JSON.stringify(data, null, 2)}`);

    await generateExport.update("generate-export-done", {
      state: "success",
      data: {
        url: "",
      },
    });
  },
});
