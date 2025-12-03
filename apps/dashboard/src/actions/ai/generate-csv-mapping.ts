"use server";

import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamObject } from "ai";
import { z } from "zod";

export async function generateCsvMapping(
  fieldColumns: string[],
  firstRows: Record<string, string>[],
) {
  const stream = createStreamableValue();

  // Start async work and handle errors properly
  (async () => {
    try {
      const { partialObjectStream } = await streamObject({
        model: openai("gpt-5-nano"),
        schema: z.object({
          date: z
            .string()
            .optional()
            .describe(
              "The column name from the CSV that contains the transaction date",
            ),
          description: z
            .string()
            .optional()
            .describe(
              "The column name from the CSV that contains the transaction description",
            ),
          amount: z
            .string()
            .optional()
            .describe(
              "The column name from the CSV that contains the transaction amount",
            ),
          balance: z
            .string()
            .optional()
            .describe(
              "The column name from the CSV that contains the account balance",
            ),
          currency: z
            .string()
            .optional()
            .describe(
              "Either the column name from the CSV that contains the currency (e.g., 'Currency', 'CCY'), or a detected currency code (e.g., 'USD', 'EUR', 'SEK') if currency is embedded in amount values or detected from the data. Return the column name if a currency column exists, otherwise return the detected currency code.",
            ),
        }),
        prompt: `
        The following columns are the headings from a CSV import file for importing transactions. 
        Map these column names to the correct fields in our database (date, description, amount, balance, currency) by providing the matching column name from the CSV for each field.
        You may also consult the first few rows of data to help you make the mapping. 
        If you are not sure or there is no matching column, omit the value.

        Available CSV columns:
        ${fieldColumns.join(", ")}

        First few rows of data:
        ${firstRows.map((row) => JSON.stringify(row)).join("\n")}

        Return the column names from the CSV that match each field. For example:
        - If the CSV has a column "Transaction Date", return "Transaction Date" for the date field
        - If the CSV has a column "Amount" or "Transaction Amount", return that column name for the amount field
        - For currency: If there's a currency column (e.g., "Currency", "CCY", "Currency Code"), return that column name. Otherwise, detect the currency from amount values (e.g., "100 SEK", "€50", "$25") or from the data structure and return the currency code (e.g., "SEK", "EUR", "USD")
        - Return only the exact column name as it appears in the CSV for column mappings, or a valid ISO currency code (3 letters) if detecting currency from values
      `,
      });

      for await (const partialObject of partialObjectStream) {
        stream.update(partialObject);
      }

      stream.done();
    } catch (error) {
      // Ensure stream is always closed, even on error
      stream.done();
      // Log error but don't throw to prevent unhandled rejection
      console.error("Error generating CSV mapping:", error);
    }
  })().catch((error) => {
    // Catch any unhandled promise rejections
    console.error("Unhandled error in CSV mapping:", error);
    stream.done();
  });

  return { object: stream.value };
}
