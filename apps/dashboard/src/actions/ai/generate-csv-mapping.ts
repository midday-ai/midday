"use server";

import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";

export async function generateCsvMapping(
  fieldColumns: string[],
  firstRows: Record<string, string>[],
) {
  const stream = createStreamableValue();

  (async () => {
    const { partialObjectStream } = await streamObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        date: z
          .date()
          .transform((value) => new Date(value))
          .describe(
            "The date of the transaction, return it in ISO-8601 format",
          ),
        description: z.string().describe("The text describing the transaction"),
        amount: z
          .number()
          .describe(
            "The amount involved in the transaction, including the minus sign if present",
          ),
        balance: z
          .number()
          .optional()
          .describe(
            "The balance of the account after the transaction, typically a cumulative value that changes with each transaction. It's usually a larger number compared to individual transaction amounts.",
          ),
      }),
      prompt: `
        The following columns are the headings from a CSV import file for importing a transactions. 
        Map these column names to the correct fields in our database (date, description, amount, balance) by providing the matching column name for each field.
        You may also consult the first few rows of data to help you make the mapping, but you are mapping the columns, not the values. 
        If you are not sure or there is no matching column, omit the value.

        Columns:
        ${fieldColumns.join(",")}

        First few rows of data:
        ${firstRows.map((row) => JSON.stringify(row)).join("\n")}
      `,
      temperature: 0.2,
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
