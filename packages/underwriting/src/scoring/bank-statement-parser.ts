import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import {
  type BankStatementExtraction,
  bankStatementExtractionSchema,
} from "./schemas";

// ============================================================================
// Stage 1: Bank Statement Parsing with Gemini
// ============================================================================

const google = createGoogleGenerativeAI();

const BANK_STATEMENT_PROMPT = `You are an expert financial document analyst specializing in bank statement extraction for MCA (Merchant Cash Advance) underwriting.

Analyze the provided bank statement PDF(s) and extract structured data with maximum accuracy.

=== EXTRACTION INSTRUCTIONS ===

For EACH month present in the statements, extract:
1. **Month label**: Format as "Mon YYYY" (e.g., "Oct 2025")
2. **Year**: Four-digit year
3. **Total Deposits**: Sum of ALL credit/deposit transactions for the month
4. **Total Withdrawals**: Sum of ALL debit/withdrawal transactions for the month
5. **Ending Balance**: The closing/ending balance shown on the statement
6. **Average Daily Balance**: Calculate from daily balances if shown, or estimate from (beginning balance + ending balance) / 2
7. **NSF Count**: Count of NSF (Non-Sufficient Funds), returned items, or overdraft occurrences
8. **Largest Deposit**: The single largest deposit transaction in the month
9. **Deposit Count**: Total number of individual deposit transactions

=== MCA PAYMENT DETECTION ===

Look for recurring debit payments that may indicate existing MCA (Merchant Cash Advance) positions:
- Daily or weekly debits to companies with names containing: "capital", "funding", "advance", "merchant", "factor", "funder"
- Common MCA funder names: Yellowstone Capital, CAN Capital, OnDeck, Kabbage, BlueVine, Rapid Finance, Credibly, National Funding, Forward Financing, Libertas, Fox Capital, Greenbox, CFG Merchant, Pearl Capital, Kalamata, Unique Funding, Everest Business, etc.
- Regular fixed-amount debits (same amount daily or weekly) that look like ACH repayments
- ACH debits with reference codes suggesting MCA repayment

For each suspected MCA payment, report:
- The funder name (as it appears on the statement)
- Approximate monthly total paid to that funder
- Payment frequency (daily, weekly, bi-weekly, monthly)

=== ACCOUNT INFORMATION ===

Extract if visible:
- Account holder name
- Bank name
- Account type (checking, savings, business checking, etc.)

=== IMPORTANT RULES ===

- Process ALL months present in the statements, in chronological order
- Use exact dollar amounts as shown on the statements (no rounding)
- If a field cannot be determined, use 0 for numeric fields
- Be precise with NSF detection - only count actual NSF/returned items, not regular debits
- For MCA detection, only flag payments you are reasonably confident are MCA-related`;

/**
 * Parse bank statement PDFs using Gemini to extract structured financial data.
 *
 * Uses generateObject with a Zod schema for type-safe structured output.
 * PDF buffers are passed as file content parts in the message.
 */
export async function parseBankStatements(
  pdfBuffers: { fileName: string; buffer: Buffer }[],
): Promise<BankStatementExtraction> {
  if (pdfBuffers.length === 0) {
    return {
      months: [],
      accountHolder: undefined,
      bankName: undefined,
      accountType: undefined,
      suspectedMcaPayments: [],
    };
  }

  // Build content parts: system prompt text + each PDF as file content
  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Buffer; mediaType: "application/pdf" }
  > = [
    {
      type: "text" as const,
      text: `Analyze the following ${pdfBuffers.length} bank statement PDF(s) and extract the data as instructed.\n\nFile names: ${pdfBuffers.map((p) => p.fileName).join(", ")}`,
    },
    ...pdfBuffers.map((pdf) => ({
      type: "file" as const,
      data: pdf.buffer,
      mediaType: "application/pdf" as const,
    })),
  ];

  const result = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: bankStatementExtractionSchema,
    messages: [
      {
        role: "system",
        content: BANK_STATEMENT_PROMPT,
      },
      {
        role: "user",
        content: contentParts,
      },
    ],
    temperature: 0,
  });

  return result.object;
}
