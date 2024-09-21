import { Database } from "@midday/supabase/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { endOfYear, format, startOfYear, subYears } from "date-fns";
import { PDFDocument, rgb } from "pdf-lib";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface TaxCategory {
  name: string;
  description: string;
  isDeductible: boolean;
}

const TAX_CATEGORIES: { [key: string]: TaxCategory } = {
  INCOME: {
    name: "Income",
    description: "All income transactions",
    isDeductible: false,
  },
  BUSINESS_EXPENSE: {
    name: "Business Expenses",
    description: "Deductible business expenses",
    isDeductible: true,
  },
  CHARITABLE_DONATIONS: {
    name: "Charitable Donations",
    description: "Donations to qualified organizations",
    isDeductible: true,
  },
  MEDICAL_EXPENSES: {
    name: "Medical Expenses",
    description: "Qualifying medical and dental expenses",
    isDeductible: true,
  },
  EDUCATION_EXPENSES: {
    name: "Education Expenses",
    description: "Qualifying education-related expenses",
    isDeductible: true,
  },
  RETIREMENT_CONTRIBUTIONS: {
    name: "Retirement Contributions",
    description: "Contributions to retirement accounts",
    isDeductible: true,
  },
  OTHER: {
    name: "Other",
    description: "Transactions not categorized for tax purposes",
    isDeductible: false,
  },
};

interface TaxSummary {
  year: number;
  categories: {
    [key: string]: {
      total: number;
      transactions: Transaction[];
    };
  };
}

const INCOME_KEYWORDS = [
  "salary",
  "wage",
  "dividend",
  "interest",
  "royalty",
  "rent",
];
const BUSINESS_KEYWORDS = [
  "office",
  "supplies",
  "equipment",
  "travel",
  "advertising",
];
const CHARITY_KEYWORDS = ["donation", "nonprofit", "foundation"];
const MEDICAL_KEYWORDS = ["doctor", "hospital", "pharmacy", "insurance"];
const EDUCATION_KEYWORDS = ["tuition", "books", "school", "university"];
const RETIREMENT_KEYWORDS = ["401k", "ira", "pension"];

function categorizeTransaction(transaction: Transaction): string {
  const description = transaction.description?.toLowerCase() || "";
  const merchant = transaction.merchant_name?.toLowerCase() || "";
  const category = transaction.category_slug?.toLowerCase() || "";

  // Helper function to check if any keyword matches
  const matchesKeywords = (keywords: string[]) =>
    keywords.some(
      (keyword) => description.includes(keyword) || merchant.includes(keyword),
    );

  // Income categorization
  if (transaction.amount > 0) {
    if (matchesKeywords(INCOME_KEYWORDS)) return "INCOME";
    // If it's a positive amount but doesn't match income keywords, it might be a refund or reimbursement
    return "OTHER_INCOME";
  }

  // Expense categorization
  if (category === "business" || matchesKeywords(BUSINESS_KEYWORDS))
    return "BUSINESS_EXPENSE";
  if (category === "charity" || matchesKeywords(CHARITY_KEYWORDS))
    return "CHARITABLE_DONATIONS";
  if (category === "medical" || matchesKeywords(MEDICAL_KEYWORDS))
    return "MEDICAL_EXPENSES";
  if (category === "education" || matchesKeywords(EDUCATION_KEYWORDS))
    return "EDUCATION_EXPENSES";
  if (category === "retirement" || matchesKeywords(RETIREMENT_KEYWORDS))
    return "RETIREMENT_CONTRIBUTIONS";

  // Additional categories
  if (category === "housing" || /^mortgage|rent$/i.test(description))
    return "HOUSING_EXPENSE";
  if (
    category === "transportation" ||
    /^(gas|fuel|auto|car)/i.test(description)
  )
    return "TRANSPORTATION_EXPENSE";
  if (
    category === "utilities" ||
    /^(electric|water|gas|internet|phone)/i.test(description)
  )
    return "UTILITIES_EXPENSE";
  if (category === "food" || /^(grocery|restaurant)/i.test(description))
    return "FOOD_EXPENSE";

  // Check for potential tax-related transactions
  if (/tax|irs|revenue/i.test(description)) return "TAX_RELATED";

  // If no specific category is determined, categorize based on amount
  return transaction.amount < -1000 ? "LARGE_EXPENSE" : "OTHER";
}

/**
 * Generates a tax summary for a given year and team.
 *
 * @param io - The Trigger.dev IO context for database operations.
 * @param teamId - The ID of the team for which to generate the summary.
 * @param year - The year for which to generate the summary.
 * @returns The generated tax summary.
 */
async function generateTaxSummary(
  io: any,
  teamId: string,
  year: number,
): Promise<TaxSummary> {
  const startDate = startOfYear(new Date(year, 0, 1));
  const endDate = endOfYear(new Date(year, 0, 1));

  const { data: transactions, error } = await io.supabase.client
    .from("transactions")
    .select("*")
    .eq("team_id", teamId)
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"));

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }

  const summary: TaxSummary = {
    year,
    categories: Object.keys(TAX_CATEGORIES).reduce(
      (acc, category) => {
        acc[category] = { total: 0, transactions: [] };
        return acc;
      },
      {} as TaxSummary["categories"],
    ),
  };

  transactions.forEach((transaction: Transaction) => {
    const category = categorizeTransaction(transaction);
    if (summary.categories[category]) {
      summary.categories[category].total += Math.abs(transaction.amount);
      summary.categories[category].transactions.push(transaction);
    } else {
      console.warn(`Unexpected category: ${category}`);
    }
  });

  return summary;
}

/**
 * Generates a PDF document containing the tax summary.
 *
 * @param summary - The tax summary to be included in the PDF.
 * @param teamNameOrTeamID - The name of the team associated with this summary.
 * @returns A Uint8Array representing the PDF document.
 */
async function generateTaxSummaryPDF(
  summary: TaxSummary,
  teamNameOrTeamID: string,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;

  let yPosition = height - 50;

  const drawText = (text: string, size = fontSize, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x: 50, y: yPosition, size, color });
    yPosition -= lineHeight;
  };

  drawText(`Tax Summary for ${teamNameOrTeamID} - Year ${summary.year}`, 18);
  yPosition -= lineHeight;

  Object.entries(summary.categories).forEach(([categoryKey, categoryData]) => {
    const category = TAX_CATEGORIES[categoryKey];
    drawText(
      `${category?.name || "Unknown Category"}: $${categoryData.total.toFixed(2)}`,
      14,
    );
    drawText(
      `  ${category?.description || "Unknown Description"}`,
      10,
      rgb(0.4, 0.4, 0.4),
    );
    drawText(
      `  Number of transactions: ${categoryData.transactions.length}`,
      10,
      rgb(0.4, 0.4, 0.4),
    );
    yPosition -= lineHeight / 2;
  });

  return pdfDoc.save();
}

/**
 * Defines a job to generate tax-related transaction summaries for teams.
 *
 * This job performs the following steps:
 * 1. Generates a tax summary for the specified year (or previous year if not specified).
 * 2. Creates a PDF report of the tax summary.
 * 3. Uploads the PDF to Supabase storage.
 * 4. Returns the summary data and a download link for the PDF.
 *
 * @remarks
 * This job uses the Trigger.dev framework for job definition and execution.
 * It integrates with Supabase for data retrieval and storage.
 *
 * @example
 * To trigger this job, you can use the following code:
 *
 * ```typescript
 * import { client } from "@/path/to/trigger-client";
 * import { Events } from "@/path/to/constants";
 *
 * const triggerTaxSummary = async () => {
 *   const event = await client.sendEvent({
 *     name: Events.GENERATE_TAX_SUMMARY,
 *     payload: {
 *       teamId: "team_123456",
 *       year: 2023, // Optional, defaults to previous year
 *     },
 *   });
 *
 *   console.log("Tax summary job triggered:", event);
 * };
 *
 * triggerTaxSummary();
 * ```
 */
client.defineJob({
  id: Jobs.GENERATE_TAX_SUMMARY,
  name: "Transactions - Generate Tax Summary",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.GENERATE_TAX_SUMMARY,
    schema: z.object({
      teamId: z.string(),
      year: z.number().optional(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const { teamId, year = subYears(new Date(), 1).getFullYear() } = payload;

    // Fetch team name
    const { data: teamData, error: teamError } = await io.supabase.client
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();

    if (teamError) {
      throw new Error(`Failed to fetch team data: ${teamError.message}`);
    }

    // Generate tax summary
    const summary = await generateTaxSummary(io, teamId, year);

    // if the team name is null, we will use the team id as the team name
    const teamName = teamData.name || teamId;

    // Generate PDF
    const pdfBytes = await generateTaxSummaryPDF(summary, teamName);

    // Upload PDF to Supabase storage
    const fileName = `tax_summary_${teamId}_${year}_${format(new Date(), "yyyyMMddHHmmss")}.pdf`;
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
      message: `Tax summary for year ${year} generated successfully`,
      year,
      downloadUrl: urlData.signedUrl,
      summary,
    };
  },
});

/**
 * Helper function to trigger the tax summary generation job.
 *
 * @param payload - The payload for the tax summary generation job.
 * @returns A promise that resolves with the event details.
 *
 * @example
 * ```typescript
 * import { triggerTaxSummary } from "@/path/to/this/file";
 *
 * const generateTaxSummary = async () => {
 *   const result = await triggerTaxSummary({
 *     teamId: "team_123456",
 *     year: 2023,
 *   });
 *
 *   console.log("Tax summary generation triggered:", result);
 * };
 * ```
 */
export async function triggerTaxSummary(payload: {
  teamId: string;
  year?: number;
}) {
  return client.sendEvent({
    name: Events.GENERATE_TAX_SUMMARY,
    payload,
  });
}
