import { blobToSerializable } from "@/utils/blob";
import { processBatch } from "@/utils/process-batch";
import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { format, parseISO } from "date-fns";
import { z } from "zod";

const ATTACHMENT_BATCH_SIZE = 20;

export const processExport = schemaTask({
  id: "process-export",
  schema: z.object({
    ids: z.array(z.string().uuid()),
    locale: z.string(),
    dateFormat: z.string().nullable().optional(),
  }),
  maxDuration: 300,
  queue: {
    concurrencyLimit: 5,
  },
  machine: {
    preset: "large-1x",
  },
  run: async ({ ids, locale, dateFormat }) => {
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
        bank_account:bank_accounts(id, name),
        tags:transaction_tags(id, tag:tags(id, name)),
        status
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
        format(parseISO(transaction.date), dateFormat ?? "LLL dd, y"),
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
        transaction?.attachments?.length > 0 ||
        transaction?.status === "completed"
          ? "Completed"
          : "Not completed",

        attachments
          .filter((a) => a.id === transaction.id)
          .map((a) => a.name)
          .join(", ") ?? "",

        transaction?.balance ?? "",
        transaction?.bank_account?.name ?? "",
        transaction?.note ?? "",
        transaction?.tags?.map((t) => t.tag?.name).join(", ") ?? "",
      ]);

    return {
      rows: rows ?? [],
      attachments: attachments ?? [],
    };
  },
});
