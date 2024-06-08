"use server";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { getCountry } from "@midday/location";
import { z } from "zod";
import { action } from "../safe-action";
import { getVatRateSchema } from "../schema";

const model = new ChatOpenAI({
  temperature: 0,
  model: "gpt-4o",
  apiKey: process.env.OPENAI_API_KEY,
});

const vatSchema = z.object({
  vat: z.number().min(5).max(100),
});

const modelWithStructuredOutput = model.withStructuredOutput(vatSchema);

export const getVatRateAction = action(getVatRateSchema, async ({ name }) => {
  const country = getCountry();

  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are an expert in VAT rates for the specific country and category",
    ],
    ["human", `What's the VAT rate for category ${name} in ${country.name}?`],
  ]);

  const chain = prompt.pipe(modelWithStructuredOutput);
  const result = await chain.invoke({});

  return {
    vat: result.vat,
    country: country.name,
  };
});
