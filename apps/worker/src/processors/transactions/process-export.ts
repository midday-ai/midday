import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import { ensureFileExtension } from "@midday/utils";
import { getTaxTypeLabel, resolveTaxValues } from "@midday/utils/tax";
import type { Job } from "bullmq";
import { format, parseISO } from "date-fns";
import type { ProcessExportPayload } from "../../schemas/transactions";
import { processBatch } from "../../utils/process-batch";
import { BaseProcessor } from "../base";

const ATTACHMENT_BATCH_SIZE = 20;

export class ProcessExportProcessor extends BaseProcessor<ProcessExportPayload> {
  /**
   * Process transactions for export (without Job dependency)
   * Can be called directly or via process() method
   */
  async processTransactions(params: {
    ids: string[];
    locale: string;
    dateFormat?: string | null;
    onProgress?: (progress: number) => Promise<void>;
  }): Promise<{
    rows: unknown[][];
    attachments: Array<{
      id: string;
      name: string;
      blob: Blob | undefined;
    }>;
  }> {
    const { ids, locale, dateFormat, onProgress } = params;
    const supabase = createClient();

    if (onProgress) await onProgress(10);

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

    if (onProgress) await onProgress(30);

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
                  blob: data ?? undefined,
                };
              },
            );
          }),
        );

        return batchAttachments.flat();
      },
    );

    if (onProgress) await onProgress(70);

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

    if (onProgress) await onProgress(100);

    return {
      rows: rows ?? [],
      attachments: attachments ?? [],
    };
  }

  /**
   * Process method for BullMQ job execution
   */
  async process(job: Job<ProcessExportPayload>): Promise<{
    rows: unknown[][];
    attachments: Array<{
      id: string;
      name: string;
      blob: Blob | undefined;
    }>;
  }> {
    return this.processTransactions({
      ids: job.data.ids,
      locale: job.data.locale,
      dateFormat: job.data.dateFormat,
      onProgress: async (progress) => {
        await this.updateProgress(job, progress);
      },
    });
  }
}
