import { writeToString } from "@fast-csv/format";
import { getTransactions } from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import type { Job } from "bullmq";
import { format } from "date-fns";
import iconv from "iconv-lite";
import type { ExportTaxFilingPayload } from "../../schemas/tax-filing";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";
import {
  ACCOUNTING_FORMATS,
  getAccountName,
  getTaxCategoryName,
  DEFAULT_CREDIT_ACCOUNTS,
  DEFAULT_DEBIT_ACCOUNTS,
  type AccountingFormat,
} from "../../utils/accounting-formats-jp";

interface TransactionRow {
  date: string;
  debitAccount: string;
  debitSubAccount: string;
  debitAmount: number;
  debitTaxCategory: string;
  creditAccount: string;
  creditSubAccount: string;
  creditAmount: number;
  creditTaxCategory: string;
  description: string;
  account?: string;
  taxCategory?: string;
  amount?: number;
  counterparty?: string;
}

function getFiscalYearDateRange(fiscalYear: number): { from: string; to: string } {
  return {
    from: `${fiscalYear}-01-01`,
    to: `${fiscalYear}-12-31`,
  };
}

export class ExportTaxFilingProcessor extends BaseProcessor<ExportTaxFilingPayload> {
  async process(job: Job<ExportTaxFilingPayload>): Promise<{
    filePath: string;
    fullPath: string;
    fileName: string;
    format: AccountingFormat;
    fiscalYear: number;
    transactionCount: number;
  }> {
    const { teamId, fiscalYear, format: exportFormat } = job.data;
    const supabase = createClient();
    const db = getDb();

    const formatConfig = ACCOUNTING_FORMATS[exportFormat];
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const fileName = `tax-filing-${fiscalYear}-${exportFormat}-${dateStr}.csv`;
    const path = `${teamId}/exports`;
    const fullPath = `${path}/${fileName}`;

    await this.updateProgress(job, 10, "Fetching transactions");

    // Get fiscal year date range
    const { from, to } = getFiscalYearDateRange(fiscalYear);

    // Fetch all transactions for the fiscal year
    const transactionsResult = await getTransactions(db, {
      teamId,
      start: from,
      end: to,
      pageSize: 10000, // Fetch all transactions
    });

    const transactions = transactionsResult.data || [];

    await this.updateProgress(job, 40, "Transforming data");

    // Transform transactions to accounting software format
    const rows = this.transformTransactionsToAccountingFormat(
      transactions,
      exportFormat,
    );

    await this.updateProgress(job, 60, "Generating CSV");

    // Generate CSV with appropriate headers
    const headers = formatConfig.columns.map((col) => col.header);
    const csvRows = rows.map((row) =>
      formatConfig.columns.map((col) => {
        const value = row[col.key as keyof TransactionRow];
        return value !== undefined && value !== null ? String(value) : "";
      }),
    );

    const csvContent = await writeToString(csvRows, {
      headers,
      delimiter: ",",
    });

    await this.updateProgress(job, 80, "Encoding file");

    // Apply encoding (Shift_JIS for yayoi, UTF-8 for others)
    let fileBuffer: Buffer;
    if (formatConfig.encoding === "shift_jis") {
      fileBuffer = iconv.encode(csvContent, "Shift_JIS");
    } else {
      // Add BOM for UTF-8 to help Excel detect encoding
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      fileBuffer = Buffer.concat([bom, Buffer.from(csvContent, "utf-8")]);
    }

    await this.updateProgress(job, 90, "Uploading file");

    // Upload to Supabase storage
    const { error: uploadError } = await withTimeout(
      supabase.storage.from("vault").upload(fullPath, fileBuffer, {
        upsert: true,
        contentType: "text/csv",
      }),
      TIMEOUTS.FILE_UPLOAD,
      `File upload timed out after ${TIMEOUTS.FILE_UPLOAD}ms`,
    );

    if (uploadError) {
      throw new Error(`Failed to upload export file: ${uploadError.message}`);
    }

    await this.updateProgress(job, 100, "Export completed");

    return {
      filePath: fileName,
      fullPath,
      fileName,
      format: exportFormat,
      fiscalYear,
      transactionCount: rows.length,
    };
  }

  private transformTransactionsToAccountingFormat(
    transactions: Array<{
      id: string;
      date: string | null;
      name: string | null;
      description: string | null;
      amount: number;
      currency: string | null;
      category?: { slug: string | null } | null;
      counterparty_name?: string | null;
      tax_category?: string | null;
      expense_category_code?: string | null;
    }>,
    formatType: AccountingFormat,
  ): TransactionRow[] {
    const rows: TransactionRow[] = [];
    const formatConfig = ACCOUNTING_FORMATS[formatType];

    for (const transaction of transactions) {
      if (!transaction.date) continue;

      const isIncome = transaction.amount > 0;
      const categoryCode = (transaction as Record<string, unknown>).expense_category_code as string | undefined;
      const taxCategory = (transaction as Record<string, unknown>).tax_category as string | undefined;
      const accountName = getAccountName(categoryCode, formatType);
      const taxCategoryName = getTaxCategoryName(
        taxCategory,
        formatType,
        isIncome,
      );

      const row: TransactionRow = {
        date: format(
          new Date(transaction.date),
          formatConfig.dateFormat,
        ),
        debitAccount: isIncome
          ? DEFAULT_DEBIT_ACCOUNTS[formatType]
          : accountName,
        debitSubAccount: "",
        debitAmount: Math.abs(transaction.amount),
        debitTaxCategory: isIncome ? "" : taxCategoryName,
        creditAccount: isIncome
          ? accountName
          : DEFAULT_CREDIT_ACCOUNTS[formatType],
        creditSubAccount: "",
        creditAmount: Math.abs(transaction.amount),
        creditTaxCategory: isIncome ? taxCategoryName : "",
        description: transaction.name || transaction.description || "",
        // For freee format (single-entry style)
        account: accountName,
        taxCategory: taxCategoryName,
        amount: transaction.amount,
        counterparty: (transaction as Record<string, unknown>).counterparty_name as string || "",
      };

      rows.push(row);
    }

    // Sort by date (newest first)
    rows.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return rows;
  }
}
