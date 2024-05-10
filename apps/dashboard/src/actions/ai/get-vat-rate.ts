"use server";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import { action } from "../safe-action";
import { getVatRateSchema } from "../schema";

const model = new ChatGroq({
  temperature: 0,
  model: "mixtral-8x7b-32768",
  apiKey: process.env.GROQ_API_KEY,
});

const vatSchema = z.object({
  vat: z.number().min(5).max(100),
});

const modelWithStructuredOutput = model.withStructuredOutput(vatSchema);

export const getVatRateAction = action(getVatRateSchema, async ({ name }) => {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are an expert in VAT rates for the specific country and category",
    ],
    ["human", `What's the VAT rate for category ${name} in Sweden?`],
  ]);

  const chain = prompt.pipe(modelWithStructuredOutput);
  const result = await chain.invoke({});

  return result;
});
