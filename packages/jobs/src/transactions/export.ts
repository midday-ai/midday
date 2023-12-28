import { writeToString } from "@fast-csv/format";
import { getTransactionsQuery } from "@midday/supabase/queries";
import { download } from "@midday/supabase/storage";
import { eventTrigger } from "@trigger.dev/sdk";
import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { format } from "date-fns";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.TRANSACTIONS_EXPORT,
  name: "🗄️ Transactions - Export",
  version: "1.0.2",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_EXPORT,
    schema: z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
      teamId: z.string(),
      locale: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const client = await io.supabase.client;

    const { from, to, teamId, locale } = payload;

    const filePath = `export-${format(new Date(from), "y-M-d")}-${format(
      new Date(to),
      "y-M-d"
    )}`;

    const path = `${teamId}/exports`;
    const fileName = `${filePath}.zip`;

    const generateExport = await io.createStatus("generate-export-start", {
      label: "Generating export",
      state: "loading",
      data: {
        progress: 10,
      },
    });

    const { data, meta } = await getTransactionsQuery(client, {
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

    await generateExport.update("generate-export-transaction", {
      state: "loading",
      data: {
        progress: 30,
      },
    });

    await generateExport.update("generate-export-attachments-start", {
      state: "loading",
      data: {
        progress: 50,
      },
    });

    const attachments = await Promise.allSettled(
      data.flatMap((transaction, idx) => {
        const rowId = idx + 1;

        return transaction?.attachments.map(
          async (attachment, idx2: number) => {
            const extension = attachment.name.split(".").pop();
            const name =
              idx2 > 0
                ? `${rowId}_${idx2}.${extension}`
                : `${rowId}.${extension}`;

            const { data } = await download(client, {
              bucket: "vault",
              path: attachment.path,
            });

            return {
              name,
              blob: data,
            };
          }
        );
      })
    );

    await generateExport.update("generate-export-attachments-end", {
      state: "loading",
      data: {
        progress: 70,
      },
    });

    await generateExport.update("generate-export-csv-start", {
      state: "loading",
      data: {
        progress: 75,
      },
    });

    const rows = data.map((transaction, idx) => [
      idx + 1,
      transaction.date,
      transaction.name,
      Intl.NumberFormat(locale, {
        style: "currency",
        currency: transaction.currency,
      }).format(transaction.amount),
      transaction?.attachments?.length > 0 ? "✔️" : "❌",
      transaction?.note ?? "",
    ]);

    const csv = await writeToString(rows, {
      headers: ["ID", "Date", "Description", "Amount", "Attachment", "Note"],
    });

    await generateExport.update("generate-export-csv-end", {
      state: "loading",
      data: {
        progress: 80,
      },
    });

    await generateExport.update("generate-export-zip", {
      state: "loading",
      data: {
        progress: 85,
      },
    });

    const zipFileWriter = new BlobWriter("application/zip");
    const zipWriter = new ZipWriter(zipFileWriter);

    zipWriter.add("transactions.csv", new TextReader(csv));

    attachments.map((attachment) => {
      if (attachment?.value.blob) {
        zipWriter.add(
          attachment.value.name,
          new BlobReader(attachment.value.blob)
        );
      }
    });

    const zip = await zipWriter.close();

    await generateExport.update("generate-export-upload", {
      state: "loading",
      data: {
        progress: 90,
      },
    });

    await client.storage
      .from("vault")
      .upload(`${path}/${fileName}`, await zip.arrayBuffer(), {
        upsert: true,
        contentType: "application/zip",
      });

    revalidateTag(`vault_${teamId}`);

    await generateExport.update("generate-export-done", {
      state: "success",
      data: {
        filePath,
        fileName,
        progress: 100,
        totalItems: meta.count,
      },
    });
  },
});
