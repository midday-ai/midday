import crypto from "node:crypto";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { eventTrigger } from "@trigger.dev/sdk";
import { capitalCase } from "change-case";
import * as d3 from "d3-dsv";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { TokenTextSplitter } from "langchain/text_splitter";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

function generateId(value: string) {
  const hash = crypto.createHash("sha256");
  hash.update(value);

  return hash.digest("hex");
}

const transformTransaction = ({ transaction, teamId }) => {
  return {
    internal_id: generateId(
      `${transaction.date}-${transaction.name}-${transaction.amount}`
    ),
    team_id: teamId,
    status: "posted",
    date: transaction.date,
    amount: transaction.amount,
    name: capitalCase(transaction.description),
    manual: true,
  };
};

const transactionSchema = z.object({
  date: z.string().describe("The date of the transaction"),
  description: z.string().describe("The description of the transaction"),
  amount: z.number().describe("The amount of the transaction"),
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
      teamId: z.string(),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io) => {
    const supabase = await io.supabase.client;

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
      }
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
    const firstFewRows = splitDocs.splice(0, 5).map((doc) => doc.pageContent);

    const extractionChainParams = firstFewRows.map((text) => {
      return { text };
    });

    const llm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT_TEMPLATE],
      ["human", "{text}"],
    ]);

    const extractionChain = prompt.pipe(
      llm.withStructuredOutput(extractionDataSchema)
    );

    await transactionsImport.update("transactions-import-transforming", {
      data: {
        step: "transforming",
      },
    });

    const results = await extractionChain.batch(extractionChainParams, {
      maxConcurrency: 5,
    });

    const transactions = results.flatMap((result) => result.transactions);
    const originalCsv = d3.csvParse(rawText);

    const firstTransaction = transactions.at(0);
    const firstRow = Object.values(originalCsv.at(0));

    const dateIndex = firstRow?.findIndex((row) =>
      row.includes(firstTransaction?.date)
    );
    const amountIndex = firstRow?.findIndex((row) =>
      row.includes(firstTransaction?.amount)
    );
    const descriptionIndex = firstRow?.findIndex((row) =>
      row.includes(firstTransaction?.description)
    );

    const mappedTransactions = originalCsv.map((row) => {
      const values = Object.values(row);

      return {
        date: values.at(dateIndex),
        amount: values.at(amountIndex),
        description: values.at(descriptionIndex),
      };
    });

    await transactionsImport.update("transactions-import-completed", {
      data: {
        step: "completed",
        transactions: mappedTransactions.map((transaction) =>
          transformTransaction({ transaction, teamId })
        ),
      },
    });
  },
});
