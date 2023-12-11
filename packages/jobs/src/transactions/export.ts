import { getTransactionsQuery } from "@midday/supabase/queries";
import { eventTrigger } from "@trigger.dev/sdk";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.TRANSACTIONS_EXPORT,
  name: "🗄️ Transactions - Export",
  version: "1.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_EXPORT,
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
      data: {
        progress: 10,
      },
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

    // await generateExport.update("generate-export-transaction", {
    //   state: "loading",
    //   data: {
    //     progress: 30,
    //   },
    // });

    await generateExport.update("generate-export-transaction", {
      state: "loading",
      data: {
        progress: 50,
      },
    });

    await io.logger.info(`Transactions: ${JSON.stringify(data, null, 2)}`);

    await generateExport.update("generate-export-attachments", {
      state: "loading",
      data: {
        progress: 70,
      },
    });

    await generateExport.update("generate-export-zip", {
      state: "loading",
      data: {
        progress: 80,
      },
    });

    await generateExport.update("generate-export-move", {
      state: "loading",
      data: {
        progress: 90,
      },
    });

    await generateExport.update("generate-export-done", {
      state: "success",
      data: {
        url: "https://service.midday.ai",
        progress: 100,
        totalItems: data.meta.count,
      },
    });
  },
});
