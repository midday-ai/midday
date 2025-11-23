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

  (async () => {
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
      }),
      prompt: `
        The following columns are the headings from a CSV import file for importing transactions. 
        Map these column names to the correct fields in our database (date, description, amount, balance) by providing the matching column name from the CSV for each field.
        You may also consult the first few rows of data to help you make the mapping, but you are mapping the column names, not the values. 
        If you are not sure or there is no matching column, omit the value.

        Available CSV columns:
        ${fieldColumns.join(", ")}

        First few rows of data:
        ${firstRows.map((row) => JSON.stringify(row)).join("\n")}

        Return the column names from the CSV that match each field. For example:
        - If the CSV has a column "Transaction Date", return "Transaction Date" for the date field
        - If the CSV has a column "Amount" or "Transaction Amount", return that column name for the amount field
        - Return only the exact column name as it appears in the CSV
      `,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
