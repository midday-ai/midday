import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { blobToSerializable } from "jobs/utils/blob";
import { processBatch } from "jobs/utils/process-batch";
import { z } from "zod";

const ATTACHMENT_BATCH_SIZE = 20;

export const processExport = schemaTask({
  id: "process-export",
  schema: z.object({
    ids: z.array(z.string().uuid()),
    locale: z.string(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 5,
  },
  machine: {
    preset: "large-1x",
  },
  run: async ({ ids, locale }) => {
    const supabase = createClient();

    const { data: transactionsData } = await supabase
      .from("transactions")
      .select(`
        id,
        date,
        name,
        description,
        amount,
        note,
        balance,
        currency,
        vat:calculated_vat,
        attachments:transaction_attachments(*),
        category:transaction_categories(id, name, description),
        bank_account:bank_accounts(id, name)
      `)
      .in("id", ids)
      .throwOnError();

    const attachments = await processBatch(
      transactionsData ?? [],
      ATTACHMENT_BATCH_SIZE,
      async (batch) => {
        const batchAttachments = await Promise.all(
          batch.flatMap((transaction, idx) => {
            const rowId = idx + 1;
            return (transaction.attachments ?? []).map(
              async (attachment, idx2: number) => {
                const filename = attachment.name?.split(".").at(0);
                const extension = attachment.name?.split(".").at(-1);

                const name =
                  idx2 > 0
                    ? `${filename}-${rowId}_${idx2}.${extension}`
                    : `${filename}-${rowId}.${extension}`;

                const { data } = await download(supabase, {
                  bucket: "vault",
                  path: (attachment.path ?? []).join("/"),
                });

                return {
                  id: transaction.id,
                  name,
                  blob: data ? await blobToSerializable(data) : null,
                };
              },
            );
          }),
        );

        return batchAttachments.flat();
      },
    );

    const rows = transactionsData
      ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((transaction) => [
        transaction.id,
        transaction.date,
        transaction.name,
        transaction.description,
        transaction.amount,
        transaction.currency,
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
        transaction?.attachments?.length > 0 ? "✔️" : "❌",

        attachments
          .filter((a) => a.id === transaction.id)
          .map((a) => a.name)
          .join(", ") ?? "",

        transaction?.balance ?? "",
        transaction?.bank_account?.name ?? "",
        transaction?.note ?? "",
      ]);

    return {
      rows: rows ?? [],
      attachments: attachments ?? [],
    };
  },
});
