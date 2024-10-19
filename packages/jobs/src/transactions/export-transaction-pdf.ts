import { TransactionSchema as Transaction } from "@midday/supabase/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { format, parseISO, startOfMonth } from "date-fns";
import { revalidateTag } from "next/cache";
import { PageSizes, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";
import { ConsoleLogger } from "../utils/console-log";

interface TransactionSummary {
  totalAmount: number;
  transactionCount: number;
  categories: { [key: string]: number };
  merchants: { [key: string]: number };
}

async function generateTransactionsPDF(
  transactions: Transaction[],
  teamName: string,
  dateRange: { start: string; end: string },
  merchant?: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const addPage = () => {
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    return { page, width, height };
  };

  let { page, width, height } = addPage();
  const margin = 50;
  const fontSize = 10;
  const lineHeight = fontSize * 1.5;

  // Helper function to add text with overflow handling
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    if (y < margin) {
      ({ page, height } = addPage());
      y = height - margin;
    }
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font: helveticaFont,
      ...options,
    });
    return y - lineHeight;
  };

  // Add company logo (placeholder)
  page.drawRectangle({
    x: margin,
    y: height - margin - 40,
    width: 100,
    height: 40,
    color: rgb(0.9, 0.9, 0.9),
  });
  addText("Solomon AI", margin + 30, height - margin - 25, {
    size: 16,
    font: helveticaBold,
  });

  // Add title
  let y = addText(
    `Transaction Report for ${teamName}`,
    width / 2,
    height - margin - 60,
    {
      size: 24,
      font: helveticaBold,
      color: rgb(0.2, 0.4, 0.6),
    },
  );

  // Add date range and merchant info
  y = addText(
    `Date Range: ${format(parseISO(dateRange.start), "MMMM d, yyyy")} to ${format(parseISO(dateRange.end), "MMMM d, yyyy")}`,
    margin,
    y - 30,
    { color: rgb(0.4, 0.4, 0.4) },
  );

  if (merchant) {
    y = addText(`Merchant: ${merchant}`, margin, y - lineHeight, {
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  // Add generation date
  y = addText(
    `Generated on: ${format(new Date(), "MMMM d, yyyy 'at' HH:mm:ss")}`,
    margin,
    y - lineHeight,
    { color: rgb(0.4, 0.4, 0.4) },
  );

  // Add summary
  const summary = calculateTransactionSummary(transactions);
  y -= lineHeight * 2;
  y = addText("Transaction Summary", margin, y, {
    font: helveticaBold,
    size: 16,
    color: rgb(0.2, 0.4, 0.6),
  });
  y = addText(
    `Total Amount: $${summary.totalAmount.toFixed(2)}`,
    margin,
    y - lineHeight,
  );
  y = addText(
    `Number of Transactions: ${summary.transactionCount}`,
    margin,
    y - lineHeight,
  );

  // Add top categories
  y -= lineHeight;
  y = addText("Top Categories:", margin, y, { font: helveticaBold });
  Object.entries(summary.categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([category, count]) => {
      y = addText(`${category}: ${count}`, margin + 20, y - lineHeight);
    });

  // Add top merchants
  y -= lineHeight;
  y = addText("Top Merchants:", margin, y, { font: helveticaBold });
  Object.entries(summary.merchants)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([merchant, count]) => {
      y = addText(`${merchant}: ${count}`, margin + 20, y - lineHeight);
    });

  // Add table headers
  y -= lineHeight * 2;
  const headers = ["Date", "Description", "Amount", "Category", "Merchant"];
  const columnWidths = [80, 150, 80, 100, 100];
  headers.forEach((header, index) => {
    let xPos =
      margin +
      columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
    y = addText(header, xPos, y, { font: helveticaBold, color: rgb(1, 1, 1) });
  });
  y -= 5;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 10;

  // Add transaction data
  transactions.forEach((transaction, index) => {
    const rowColor = index % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
    page.drawRectangle({
      x: margin,
      y: y + 5,
      width: width - 2 * margin,
      height: lineHeight,
      color: rowColor,
    });

    let xPos = margin;
    y = addText(format(parseISO(transaction.date), "yyyy-MM-dd"), xPos, y);
    xPos += columnWidths[0] as any;
    y = addText(transaction.name.slice(0, 20), xPos, y + lineHeight);
    xPos += columnWidths[1] as any;
    y = addText(`$${transaction.amount.toFixed(2)}`, xPos, y + lineHeight);
    xPos += columnWidths[2] as any;
    y = addText(
      transaction.category_slug || "Uncategorized",
      xPos,
      y + lineHeight,
    );
    xPos += columnWidths[3] as any;
    y = addText(transaction.merchant_name || "N/A", xPos, y + lineHeight);
    y -= 5;
  });

  // Add page numbers
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    page.drawText(`Page ${i + 1} of ${pageCount}`, {
      x: width - margin - 60,
      y: margin / 2,
      size: 8,
      font: helveticaFont,
    });
  }

  return pdfDoc.save();
}

function calculateTransactionSummary(
  transactions: Transaction[],
): TransactionSummary {
  return transactions.reduce(
    (summary, transaction) => {
      summary.totalAmount += transaction.amount;
      summary.transactionCount += 1;
      summary.categories[transaction.category_slug || "Uncategorized"] =
        (summary.categories[transaction.category_slug || "Uncategorized"] ||
          0) + 1;
      summary.merchants[transaction.merchant_name || "N/A"] =
        (summary.merchants[transaction.merchant_name || "N/A"] || 0) + 1;
      return summary;
    },
    {
      totalAmount: 0,
      transactionCount: 0,
      categories: {},
      merchants: {},
    } as TransactionSummary,
  );
}

client.defineJob({
  id: Jobs.TRANSACTION_EXPORT_DETAILS,
  name: "Transactions - Export PDF (Custom)",
  version: "0.0.5",
  trigger: eventTrigger({
    name: Events.TRANSACTION_EXPORT_DETAILS,
    schema: z.object({
      teamId: z.string(),
      startDate: z
        .string()
        .default(() => format(startOfMonth(new Date()), "yyyy-MM-dd")),
      endDate: z.string().default(() => format(new Date(), "yyyy-MM-dd")),
      merchantName: z.string().optional(),
      transactionIds: z.array(z.string()).optional(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io, ctx) => {
    const logger = new ConsoleLogger(io);
    const { teamId, startDate, endDate, merchantName, transactionIds } =
      payload;

    await logger.info("Starting transaction export job", {
      teamId,
      startDate,
      endDate,
      merchantName,
    });

    try {
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

      await logger.info("Retrieved transactions", {
        count: transactions.length,
      });

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
        merchantName ?? undefined,
      );

      await logger.info("PDF generated successfully");

      const timestamp = format(new Date(), "yyyyMMddHHmmss");
      const fileName = `transaction_report_${timestamp}_${uuidv4()}.pdf`;

      const pathTokens = [teamId, "inbox", fileName];
      const path = pathTokens.join("/");

      // Upload PDF to Supabase storage
      const { data: uploadData, error: uploadError } =
        await io.supabase.client.storage.from("vault").upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      await logger.info("PDF uploaded successfully", { fileName });

      // Create a shareable link
      const { data: urlData, error: urlError } =
        await io.supabase.client.storage
          .from("vault")
          .createSignedUrl(path, 604800); // Link valid for 7 days

      if (urlError) {
        throw new Error(`Failed to create shareable link: ${urlError.message}`);
      }

      revalidateTag(`vault_${teamId}`);

      await logger.info("Job completed successfully", {
        downloadUrl: urlData.signedUrl,
      });

      return {
        message: "PDF export completed successfully",
        downloadUrl: urlData.signedUrl,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        await logger.error("Error in transaction export job", {
          error: error.message,
        });
      } else {
        await logger.error("Error in transaction export job", {
          error: "An unknown error occurred",
        });
      }
      throw error;
    }
  },
});
