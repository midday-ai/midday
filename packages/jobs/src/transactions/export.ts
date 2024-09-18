import { writeToString } from "@fast-csv/format";
import { download } from "@midday/supabase/storage";
import { eventTrigger } from "@trigger.dev/sdk";
import { BlobReader, BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

client.defineJob({
  id: Jobs.TRANSACTIONS_EXPORT,
  name: "Transactions - Export",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_EXPORT,
    schema: z.object({
      transactionIds: z.array(z.string()),
      teamId: z.string(),
      locale: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const client = await io.supabase.client;

    const { transactionIds, teamId, locale } = payload;

    const filePath = `export-${new Date().toISOString()}`;

    const path = `${teamId}/exports`;
    const fileName = `${filePath}.zip`;

    const generateExport = await io.createStatus("generate-export-start", {
      label: "Generating export",
      state: "loading",
      data: {
        progress: 10,
      },
    });

    const { data, count } = await client
      .from("transactions")
      .select(
        `
        id,
        date,
        name,
        amount,
        note,
        balance,
        currency,
        vat:calculated_vat,
        attachments:transaction_attachments(*),
        category:transaction_categories(id, name, description),
        bank_account:bank_accounts(id, name)
      `,
        { count: "exact" }
      )
      .in("id", transactionIds)
      .eq("team_id", teamId);

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
      data?.flatMap((transaction, idx) => {
        const rowId = idx + 1;

        return transaction?.attachments?.map(
          async (attachment, idx2: number) => {
            const extension = attachment.name.split(".").pop();
            const name =
              idx2 > 0
                ? `${rowId}_${idx2}.${extension}`
                : `${rowId}.${extension}`;

            const { data } = await download(client, {
              bucket: "vault",
              path: attachment.path.join("/"),
            });

            return {
              id: transaction.id,
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

    const rows = data
      ?.sort((a, b) => a.date - b.date)
      .map((transaction, idx) => [
        transaction?.id,
        transaction.date,
        transaction.name,
        Intl.NumberFormat(locale, {
          style: "currency",
          currency: transaction.currency,
        }).format(transaction.amount),
        transaction?.vat
          ? Intl.NumberFormat(locale, {
              style: "currency",
              currency: transaction.currency,
            }).format(transaction?.vat)
          : "",
        transaction?.category?.name ?? "",
        transaction?.category?.description ?? "",
        transaction?.attachments?.length > 0 ? `${idx + 1}.pdf` : null,
        transaction?.attachments?.length > 0 ? "✔️" : "❌",
        transaction?.balance ?? "",
        transaction?.bank_account?.name ?? "",
        transaction?.note ?? "",
      ]);

    const csv = await writeToString(rows, {
      headers: [
        "ID",
        "Date",
        "Description",
        "Amount",
        "VAT",
        "Category",
        "Category description",
        "Attachment name",
        "Attachment",
        "Balance",
        "Account",
        "Note",
      ],
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

    attachments?.map((attachment) => {
      if (attachment?.value?.blob) {
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
        totalItems: count,
      },
    });
  },
});
