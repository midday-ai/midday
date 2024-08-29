/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2.45.2";
import { openai } from "https://esm.sh/@ai-sdk/openai@0.0.54";
import { CSVLoader } from "https://esm.sh/@langchain/community@0.2.31/document_loaders/fs/csv";
import { DocxLoader } from "https://esm.sh/@langchain/community@0.2.31/document_loaders/fs/docx";
import { generateObject } from "https://esm.sh/ai@3.3.20";
import { TextLoader } from "https://esm.sh/langchain@0.2.17/document_loaders/fs/text";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";
import { z } from "https://esm.sh/zod@3.21.4";
import type { Database, Tables } from "../../src/types";
import { TAGS } from "./tags.ts";

type DocumentsRecord = Tables<"documents">;

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: DocumentsRecord;
  schema: "public";
  old_record: null | DocumentsRecord;
}

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();

  const { id, name, metadata, team_id } = payload.record;

  const { data: fileData } = await supabase.storage
    .from("vault")
    .download(name);

  let document: string | null = null;

  if (!fileData) {
    return new Response("File not found", {
      status: 404,
    });
  }

  switch (metadata.mimetype) {
    case "application/pdf": {
      const content = await fileData.arrayBuffer();
      const pdf = await getDocumentProxy(content);

      const { text } = await extractText(pdf, {
        mergePages: true,
      });

      // Unsupported Unicode escape sequence
      document = text.replaceAll("\u0000", "");

      break;
    }
    case "text/csv": {
      const loader = new CSVLoader(fileData, {
        splitPages: false,
      });

      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
      break;
    }
    case "application/docx": {
      const loader = new DocxLoader(fileData);
      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));

      break;
    }
    case "text/plain": {
      const loader = new TextLoader(fileData);

      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
      break;
    }
    default:
      return new Response(`Unsupported mimetype: ${metadata.mimetype}`, {
        status: 400,
      });
  }

  if (!document) {
    return new Response("Unsupported file type or empty content", {
      status: 400,
    });
  }

  const { data: teamData } = await supabase
    .from("teams")
    .select("id, document_classification")
    .eq("id", team_id)
    .single();

  let response: { title: string | null; tag: string | null } | null = null;

  if (teamData?.document_classification) {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        title: z
          .string()
          .nullable()
          .describe("Company name, supplier name, or a document name"),
        tag: TAGS.describe("Classification of the document").nullable(),
      }),
      prompt: `
        Analyze the document and extract:
        1. Title: Company name, supplier name, or document name
        2. Tag: Classify using predefined tags only; return null if no match
        Provide concise, accurate results based on the document content.
        Document: ${document.slice(0, 1000)}
    `,
      temperature: 0.5,
    });

    response = {
      title: object?.title ?? null,
      tag: object?.tag ?? null,
    };
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      title: response?.title,
      body: document,
      tag: response?.tag,
    })
    .eq("id", id);

  if (updateError) {
    console.log(`Error updating document: ${updateError.message}`);
  }

  return new Response("Document processed and embedded successfully", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
