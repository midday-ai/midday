"use server";

import { openai } from "@ai-sdk/openai";
import { getCountry } from "@midday/location";
import { generateObject } from "ai";
import { z } from "zod";
import { authActionClient } from "../safe-action";

export const getTaxRateAction = authActionClient
  .schema(
    z.object({
      name: z.string().min(2),
    }),
  )
  .metadata({
    name: "get-tax-rate",
  })
  .action(async ({ parsedInput: { name } }) => {
    const country = await getCountry();

    const { object } = await generateObject({
      model: openai("gpt-5-mini"),
      schema: z.object({
        taxRate: z.number().min(5).max(50),
      }),
      prompt: `
        You are an expert tax consultant specializing in VAT/GST rates for businesses across different countries and industries.
        
        Please determine the standard VAT/GST rate that applies to businesses operating in the "${name}" category/industry in ${country?.name}.
        
        Consider the following:
        - Use the current standard VAT/GST rate for businesses in ${country?.name}
        - If the category "${name}" has specific exemptions or reduced rates, apply those instead
        - Focus on B2B transactions where businesses can typically reclaim input VAT
        - If multiple rates could apply, choose the most commonly applicable rate for this business category
        - Return the rate as a percentage (e.g., 20 for 20% VAT)
        
        Country: ${country?.name}
        Business Category: ${name}
      `,
      // temperature: 0,
    });

    return {
      taxRate: object.taxRate,
      country: country?.name,
    };
  });
