"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function generateInvoiceNumber(invoiceNumber: string) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      invoice_number: z.string(),
    }),
    prompt: `You are an invoice number generator. Your task is to analyze the pattern in the given invoice number and generate the next sequential number.
             Rules:
             - Preserve any prefix/suffix in the original format (e.g., INV-, -2024)
             - Increment the numerical portion by 1
             - Maintain leading zeros if present
             - If no clear pattern, increment the last number by 1
             
             Last invoice number: ${invoiceNumber}
             
             Generate the next invoice number.`,
  });

  return { nextInvoiceNumber: object.invoice_number };
}
