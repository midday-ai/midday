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
      model: openai("gpt-4o-mini"),
      schema: z.object({
        taxRate: z.number().min(5).max(100),
      }),
      prompt: `
        You are an expert in tax/vat rates for the specific country and category \n
        What's the tax/vat rate for category ${name} in ${country?.name}?
      `,
    });

    return {
      taxRate: object.taxRate,
      country: country?.name,
    };
  });
