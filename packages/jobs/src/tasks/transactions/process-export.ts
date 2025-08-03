import { getDb } from "@jobs/init";
import { blobToSerializable } from "@jobs/utils/blob";
import { processBatch } from "@jobs/utils/process-batch";
import { getTransactionsForExport } from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import { getTaxTypeLabel } from "@midday/utils/tax";
import { schemaTask } from "@trigger.dev/sdk";
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
    const db = getDb();
    const supabase = createClient(); // Still needed for storage operations

    const transactionsData = await getTransactionsForExport(db, { ids });

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
      .map((transaction) => {
        const taxRate =
          transaction?.tax_rate ?? transaction?.category?.tax_rate ?? 0;
        const taxAmount = Math.abs(
          +((taxRate * transaction.amount) / (100 + taxRate)).toFixed(2),
        );

        const formattedTaxType = getTaxTypeLabel(
          transaction?.tax_type ?? transaction?.category?.tax_type ?? "",
        );

        const formattedTaxRate = taxRate > 0 ? `${taxRate}%` : "";

        return [
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
          formattedTaxType,
          formattedTaxRate,
          Intl.NumberFormat(locale, {
            style: "currency",
            currency: transaction.currency,
          }).format(taxAmount),
          transaction?.counterparty_name ?? "",
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
        ];
      });

    return {
      rows: rows ?? [],
      attachments: attachments ?? [],
    };
  },
});
