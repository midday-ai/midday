import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { eventTrigger } from "@trigger.dev/sdk";
import { TokenTextSplitter } from "langchain/text_splitter";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const transactionSchema = z.object({
  date: z.coerce
    .date()
    .describe("The year when there was an important historic development."),
  description: z
    .string()
    .describe("What happened in this year? What was the development?"),
  amount: z
    .number()
    .describe("What happened in this year? What was the development?"),
});

const extractionDataSchema = z.object({
  transactions: z.array(transactionSchema),
});

const SYSTEM_PROMPT_TEMPLATE = `You are an expert extraction algorithm.
Only extract relevant information from the text.
If you do not know the value of an attribute asked to extract, you may omit the attribute's value.`;

client.defineJob({
  id: Jobs.TRANSACTIONS_IMPORT,
  name: "Transactions - Import",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_IMPORT,
    schema: z.object({
      filePath: z.array(z.string()),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = await io.supabase.client;

    // const { filePath } = payload;

    // const { data } = await supabase.storage
    //   .from("vault")
    //   .download(filePath.join("/"));

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT_TEMPLATE],
      // Please see the how-to about improving performance with
      // reference examples.
      // new MessagesPlaceholder("examples"),
      ["human", "{text}"],
    ]);

    const llm = new ChatOpenAI({
      modelName: "gpt-4-0125-preview",
      temperature: 0,
    });

    const extractionChain = prompt.pipe(
      llm.withStructuredOutput(extractionDataSchema)
    );
  },
});
