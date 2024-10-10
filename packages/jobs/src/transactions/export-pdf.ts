import {
  Database,
  TransactionSchema as Transaction,
} from "@midday/supabase/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { format, parseISO } from "date-fns";
import { revalidateTag } from "next/cache";
import { PDFDocument, rgb } from "pdf-lib";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

/**
 * Generates a PDF document containing transaction data.
 *
 * @param transactions - An array of transaction objects to be included in the PDF.
 * @param teamName - The name of the team associated with these transactions.
 * @param dateRange - The date range of the transactions.
 * @param merchant - The merchant name if transactions are filtered by merchant.
 * @returns A Uint8Array representing the PDF document.
 */
async function generateTransactionsPDF(
  transactions: Transaction[],
  teamName: string,
  dateRange: { start: string; end: string },
  merchant?: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;

  // Add title
  page.drawText(`Transaction Report for ${teamName}`, {
    x: 50,
    y: height - 50,
    size: 18,
    color: rgb(0, 0, 0),
  });

  // Add date range and merchant info
  page.drawText(
    `Date Range: ${format(parseISO(dateRange.start), "yyyy-MM-dd")} to ${format(parseISO(dateRange.end), "yyyy-MM-dd")}`,
    {
      x: 50,
      y: height - 80,
      size: fontSize,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

  if (merchant) {
    page.drawText(`Merchant: ${merchant}`, {
      x: 50,
      y: height - 100,
      size: fontSize,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Add generation date
  page.drawText(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, {
    x: 50,
    y: height - 120,
    size: fontSize,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Add table headers
  const headers = ["Date", "Description", "Amount", "Category", "Merchant"];
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: 50 + index * 100,
      y: height - 160,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
  });

  // Add transaction data
  transactions.forEach((transaction, index) => {
    const y = height - 190 - index * lineHeight;
    page.drawText(format(parseISO(transaction.date), "yyyy-MM-dd"), {
      x: 50,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    page.drawText(transaction.name.slice(0, 15), {
      x: 150,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    page.drawText(transaction.amount.toFixed(2), {
      x: 250,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    page.drawText(transaction.category_slug || "Uncategorized", {
      x: 350,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
    page.drawText(transaction.merchant_name || "N/A", {
      x: 450,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
  });

  return pdfDoc.save();
}

/**
 * Defines a job to export transactions as a PDF document.
 *
 * This job is triggered by an event and performs the following steps:
 * 1. Retrieves the specified transactions from the database based on the provided filters.
 * 2. Generates a PDF document containing the transaction data.
 * 3. Uploads the PDF to Supabase storage.
 * 4. Creates a shareable link for the uploaded PDF.
 *
 * @remarks
 * This job uses the Trigger.dev framework for job definition and execution.
 * It integrates with Supabase for data retrieval and file storage.
 *
 * @example
 * To trigger this job, you can use the following code:
 *
 * ```typescript
 * import { client } from "@/path/to/trigger-client";
 * import { Events } from "@/path/to/constants";
 *
 * const triggerExportPDF = async () => {
 *   const event = await client.sendEvent({
 *     name: Events.TRANSACTIONS_EXPORT_PDF,
 *     payload: {
 *       teamId: "team_123456",
 *       startDate: "2023-01-01",
 *       endDate: "2023-12-31",
 *       merchantName: "Amazon", // Optional
 *       transactionIds: ["txn_1", "txn_2", "txn_3"], // Optional
 *     },
 *   });
 *
 *   console.log("PDF export job triggered:", event);
 * };
 *
 * triggerExportPDF();
 * ```
 *
 * The job will then process the request and return a download URL for the generated PDF.
 */
client.defineJob({
  id: Jobs.TRANSACTIONS_EXPORT_PDF,
  name: "Transactions - Export PDF",
  version: "0.0.2",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_EXPORT_PDF,
    schema: z.object({
      teamId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      merchantName: z.string().optional(),
      transactionIds: z.array(z.string()).optional(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { teamId, startDate, endDate, merchantName, transactionIds } =
      payload;

    // Build the query
    let query = io.supabase.client
      .from("transactions")
      .select("*")
      .eq("team_id", teamId)
      .gte("date", startDate)
      .lte("date", endDate);

    if (merchantName) {
      query = query.eq("merchant_name", merchantName);
    }

    if (transactionIds && transactionIds.length > 0) {
      query = query.in("id", transactionIds);
    }

    // Fetch transactions
    const { data: transactions, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

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
    const pdfBytes = await generateTransactionsPDF(
      transactions,
      teamData.name as string,
      { start: startDate, end: endDate },
      merchantName ?? undefined
    );

    // Upload PDF to Supabase storage
    const fileName = `transaction_report_${teamId}_${format(new Date(), "yyyyMMddHHmmss")}.pdf`;
    const { data: uploadData, error: uploadError } =
      await io.supabase.client.storage
        .from("exports")
        .upload(fileName, pdfBytes, {
          contentType: "application/pdf",
        });

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Create a shareable link
    const { data: urlData, error: urlError } = await io.supabase.client.storage
      .from("exports")
      .createSignedUrl(fileName, 604800); // Link valid for 7 days

    if (urlError) {
      throw new Error(`Failed to create shareable link: ${urlError.message}`);
    }

    revalidateTag(`vault_${teamId}`);

    return {
      message: "PDF export completed successfully",
      downloadUrl: urlData.signedUrl,
    };
  },
});
