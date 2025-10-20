import { blobToSerializable } from "@jobs/utils/blob";
import { processBatch } from "@jobs/utils/process-batch";
import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import { ensureFileExtension } from "@midday/utils";
import { getTaxTypeLabel, resolveTaxValues } from "@midday/utils/tax";
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
        counterparty_name,
        tax_type,
        tax_rate,
        tax_amount,
        attachments:transaction_attachments(*),
        category:transaction_categories(id, name, description, tax_rate, tax_type, tax_reporting_code),
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
                const originalName = attachment.name || "attachment";

                // Only apply MIME type extension if we have a valid MIME type
                const nameWithExtension = attachment.type
                  ? ensureFileExtension(originalName, attachment.type)
                  : originalName;
                const baseFilename = nameWithExtension.replace(/\.[^.]*$/, "");

                // Extract extension properly - if no extension exists, use "bin"
                const parts = nameWithExtension.split(".");
                const extension = parts.length > 1 ? parts.pop()! : "bin";

                const name =
                  idx2 > 0
                    ? `${baseFilename}-${rowId}_${idx2}.${extension}`
                    : `${baseFilename}-${rowId}.${extension}`;

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
        const { taxAmount, taxRate, taxType } = resolveTaxValues({
          transactionAmount: transaction.amount,
          transactionTaxAmount: transaction.tax_amount,
          transactionTaxRate: transaction.tax_rate,
          transactionTaxType: transaction.tax_type,
          categoryTaxRate: transaction.category?.tax_rate,
          categoryTaxType: transaction.category?.tax_type,
        });

        const formattedTaxType = getTaxTypeLabel(taxType ?? "");
        const formattedTaxRate = taxRate != null ? `${taxRate}%` : "";

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
          }).format(taxAmount ?? 0),
          transaction?.counterparty_name ?? "",
          transaction?.category?.name ?? "",
          transaction?.category?.description ?? "",
          transaction?.category?.tax_reporting_code ?? "",
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
