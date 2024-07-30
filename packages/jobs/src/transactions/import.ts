import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { csvTransformed } from "@midday/import";
import { eventTrigger } from "@trigger.dev/sdk";
import { TokenTextSplitter } from "langchain/text_splitter";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

const transactionSchema = z.object({
  date: z.string().describe("The date usually in the format YYYY-MM-DD"),
  description: z.string().describe("The text describing the transaction"),
  amount: z
    .number()
    .describe(
      "The amount involved in the transaction, including the minus sign if present",
    ),
});

const extractionDataSchema = z.object({
  transactions: z.array(transactionSchema),
});

const SYSTEM_PROMPT_TEMPLATE = `You are an expert extraction algorithm.
Only extract relevant information from the text.
You are extracting bank transaction information`;

client.defineJob({
  id: Jobs.TRANSACTIONS_IMPORT,
  name: "Transactions - Import",
  version: "0.0.1",
  trigger: eventTrigger({
    name: Events.TRANSACTIONS_IMPORT,
    schema: z.object({
      filePath: z.array(z.string()),
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = io.supabase.client;

    const { filePath, teamId } = payload;

    const { data } = await supabase.storage
      .from("vault")
      .download(filePath.join("/"));

    const transactionsImport = await io.createStatus(
      "transactions-import-analyzing",
      {
        label: "Transactions import",
        data: {
          step: "analyzing",
        },
      },
    );

    if (!data) {
      return null;
    }

    const loader = new CSVLoader(data);

    const docs = await loader.load();
    const rawText = await data.text();

    const textSplitter = new TokenTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 0,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);

    // Skip first 5 because it can be a header
    const firstFewRows = splitDocs.splice(5, 15).map((doc) => doc.pageContent);

    const extractionChainParams = firstFewRows.map((text) => {
      return { text };
    });

    const llm = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT_TEMPLATE],
      ["human", "{text}"],
    ]);

    const extractionChain = prompt.pipe(
      llm.withStructuredOutput(extractionDataSchema),
    );

    await transactionsImport.update("transactions-import-transforming", {
      data: {
        step: "transforming",
      },
    });

    const results = await extractionChain.batch(extractionChainParams);
    const transactions = results.flatMap((result) => result.transactions);

    const transformedTransactions = csvTransformed({
      raw: rawText,
      extracted: transactions,
      teamId,
    });

    await transactionsImport.update("transactions-import-completed", {
      data: {
        step: "completed",
        transactions: transformedTransactions,
      },
    });
  },
});
