"use server";

import { LayoutProcessor } from "@midday/documents";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const getTransactionsFromLayout = authActionClient
  .schema(
    z.object({
      filePath: z.array(z.string()),
    }),
  )
  .metadata({
    name: "get-transactions-from-layout",
  })
  .action(async ({ parsedInput: { filePath }, ctx: { supabase } }) => {
    const processor = new LayoutProcessor();

    const { data } = await supabase.storage
      .from("vault")
      .download(filePath.join("/"));

    const buffer = await data?.arrayBuffer();

    if (!buffer) {
      throw Error("No file data");
    }

    const transactions = await processor.getDocument({
      content: Buffer.from(buffer).toString("base64"),
    });

    const [headerRow, ...dataRows] = transactions ?? [];

    // Get the columns from the header row
    const columns = headerRow?.cells.map((cell, index) => {
      const content = cell.content;
      return headerRow.cells.indexOf(cell) === index
        ? content
        : `${content}_${index}`;
    });

    const results = dataRows.map((row) =>
      Object.fromEntries(
        row.cells.map((cell, index) => [
          columns?.[index] ?? `${cell.content}_${index}`,
          cell.content,
        ]),
      ),
    );

    return {
      columns,
      results,
    };
  });
