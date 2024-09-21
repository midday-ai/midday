import { Database } from "@midday/supabase/types";
import { cronTrigger, eventTrigger } from "@trigger.dev/sdk";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { PDFDocument, rgb } from "pdf-lib";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

/**
 * Represents a summary of transactions for a specific period.
 */
interface TransactionSummary {
  totalAmount: number;
  transactionCount: number;
  topCategories: { [category: string]: number };
  topMerchants: { [merchant: string]: number };
  largestTransaction: Transaction | null;
  averageTransactionAmount: number;
}

/**
 * Generates a summary of transactions for a given period.
 *
 * @param transactions - An array of transactions to summarize.
 * @returns A TransactionSummary object containing various metrics.
 */
function generateSummary(transactions: Transaction[]): TransactionSummary {
  let totalAmount = 0;
  const categories: { [category: string]: number } = {};
  const merchants: { [merchant: string]: number } = {};
  let largestTransaction: Transaction | null = null;

  transactions.forEach((transaction) => {
    totalAmount += Math.abs(transaction.amount);

    if (transaction.category_slug) {
      categories[transaction.category_slug] =
        (categories[transaction.category_slug] || 0) +
        Math.abs(transaction.amount);
    }

    if (transaction.merchant_name) {
      merchants[transaction.merchant_name] =
        (merchants[transaction.merchant_name] || 0) +
        Math.abs(transaction.amount);
    }

    if (
      !largestTransaction ||
      Math.abs(transaction.amount) > Math.abs(largestTransaction.amount)
    ) {
      largestTransaction = transaction;
    }
  });

  const topCategories = Object.fromEntries(
    Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
  );

  const topMerchants = Object.fromEntries(
    Object.entries(merchants)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5),
  );

  return {
    totalAmount,
    transactionCount: transactions.length,
    topCategories,
    topMerchants,
    largestTransaction,
    averageTransactionAmount: totalAmount / transactions.length || 0,
  };
}

/**
 * Generates a transaction summary for a specific period.
 *
 * @param io - The Trigger.dev IO context for database operations.
 * @param teamId - The ID of the team for which to generate the summary.
 * @param startDate - The start date of the period to summarize.
 * @param endDate - The end date of the period to summarize.
 * @returns The generated summary object.
 */
async function generateSummaryForPeriod(
  io: any,
  teamId: string,
  startDate: Date,
  endDate: Date,
): Promise<TransactionSummary> {
  const { data: transactions, error } = await io.supabase.client
    .from("transactions")
    .select("*")
    .eq("team_id", teamId)
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"));

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  return generateSummary(transactions);
}

/**
 * Generates a PDF document containing the transaction summary.
 *
 * @param summary - The transaction summary to be included in the PDF.
 * @param teamName - The name of the team associated with this summary.
 * @param period - The period of the summary (weekly or monthly).
 * @param dateRange - The date range of the summary.
 * @returns A Uint8Array representing the PDF document.
 */
async function generateSummaryPDF(
  summary: TransactionSummary,
  teamName: string,
  period: "weekly" | "monthly",
  dateRange: { start: string; end: string },
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;

  // Add title
  page.drawText(
    `${period.charAt(0).toUpperCase() + period.slice(1)} Transaction Summary for ${teamName}`,
    {
      x: 50,
      y: height - 50,
      size: 18,
      color: rgb(0, 0, 0),
    },
  );

  // Add date range
  page.drawText(`Period: ${dateRange.start} to ${dateRange.end}`, {
    x: 50,
    y: height - 80,
    size: fontSize,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add summary data
  let yPosition = height - 120;
  const drawText = (text: string, yOffset: number = 0) => {
    page.drawText(text, {
      x: 50,
      y: yPosition + yOffset,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;
  };

  drawText(`Total Amount: $${summary.totalAmount.toFixed(2)}`);
  drawText(`Transaction Count: ${summary.transactionCount}`);
  drawText(
    `Average Transaction Amount: $${summary.averageTransactionAmount.toFixed(2)}`,
  );

  drawText("Top Categories:", lineHeight);
  Object.entries(summary.topCategories).forEach(([category, amount]) => {
    drawText(`  ${category}: $${amount.toFixed(2)}`);
  });

  drawText("Top Merchants:", lineHeight);
  Object.entries(summary.topMerchants).forEach(([merchant, amount]) => {
    drawText(`  ${merchant}: $${amount.toFixed(2)}`);
  });

  if (summary.largestTransaction) {
    drawText("Largest Transaction:", lineHeight);
    drawText(
      `  Amount: $${Math.abs(summary.largestTransaction.amount).toFixed(2)}`,
    );
    drawText(`  Date: ${summary.largestTransaction.date}`);
    drawText(`  Description: ${summary.largestTransaction.name}`);
  }

  return pdfDoc.save();
}

/**
 * Defines a job to generate transaction summaries for teams.
 *
 * This job can be triggered in two ways:
 * 1. On a schedule (cron trigger) to automatically generate summaries.
 * 2. On-demand via an event trigger for specific teams and periods.
 *
 * The job performs the following steps:
 * 1. Determines the date range for the summary based on the period type.
 * 2. Retrieves transactions for the specified team and date range.
 * 3. Generates a summary of the transactions.
 * 4. Generates a PDF document containing the summary.
 * 5. Uploads the PDF to Supabase storage.
 * 6. Creates a shareable link for the PDF.
 * 7. Returns the generated summary, download URL, and other metadata.
 *
 * @remarks
 * This job uses the Trigger.dev framework for job definition and execution.
 * It integrates with Supabase for data retrieval and storage.
 *
 * @example
 * To trigger this job on-demand, you can use the following code:
 *
 * ```typescript
 * import { client } from "@/path/to/trigger-client";
 * import { Events } from "@/path/to/constants";
 *
 * const triggerTransactionSummary = async () => {
 *   const event = await client.sendEvent({
 *     name: Events.GENERATE_TRANSACTION_SUMMARY,
 *     payload: {
 *       teamId: "team_123456",
 *       period: "monthly",
 *     },
 *   });
 *
 *   console.log("Transaction summary job triggered:", event);
 * };
 *
 * triggerTransactionSummary();
 * ```
 */
client.defineJob({
  id: Jobs.GENERATE_TRANSACTION_SUMMARY,
  name: "Transactions - Generate Summary",
  version: "0.0.3",
  trigger: eventTrigger({
    name: Events.GENERATE_TRANSACTION_SUMMARY,
    schema: z.object({
      teamId: z.string(),
      period: z.enum(["weekly", "monthly"]),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { teamId, period } = payload;
    let startDate: Date;
    let endDate: Date;

    if (period === "weekly") {
      startDate = startOfWeek(subWeeks(new Date(), 1));
      endDate = endOfWeek(subWeeks(new Date(), 1));
    } else {
      startDate = startOfMonth(subMonths(new Date(), 1));
      endDate = endOfMonth(subMonths(new Date(), 1));
    }

    const summary = await generateSummaryForPeriod(
      io,
      teamId,
      startDate,
      endDate,
    );

    // Fetch team name
    const { data: teamData, error: teamError } = await io.supabase.client
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();

    if (teamError) {
      throw new Error(`Failed to fetch team data: ${teamError.message}`);
    }

    // Generate PDF
    const pdfBytes = await generateSummaryPDF(
      summary,
      teamData.name as string,
      period,
      {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
      },
    );

    // Upload PDF to Supabase storage
    const fileName = `transaction_summary_${teamId}_${period}_${format(new Date(), "yyyyMMddHHmmss")}.pdf`;
    const { data: uploadData, error: uploadError } =
      await io.supabase.client.storage
        .from("vault")
        .upload(fileName, pdfBytes, {
          contentType: "application/pdf",
        });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Create a shareable link
    const { data: urlData, error: urlError } = await io.supabase.client.storage
      .from("vault")
      .createSignedUrl(fileName, 604800); // Link valid for 7 days

    if (urlError) {
      throw new Error(`Failed to create shareable link: ${urlError.message}`);
    }

    return {
      message: `${period.charAt(0).toUpperCase() + period.slice(1)} transaction summary generated successfully`,
      period,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      downloadUrl: urlData.signedUrl,
      summary,
    };
  },
});
