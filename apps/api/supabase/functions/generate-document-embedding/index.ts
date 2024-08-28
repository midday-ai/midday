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

const model = new Supabase.ai.Session("gte-small");

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
        You are an expert in document analysis.
        Extract the title and tag from the document.
        Only return a tag if it matches one of the predefined tags in the tag enum. If no matching tag is found, return null.
        Document: ${document.slice(0, 500)}
    `,
    temperature: 0.1,
  });

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      title: object?.title ?? null,
      body: document,
      tag: object?.tag ?? null,
    })
    .eq("id", id);

  if (updateError) {
    console.log(`Error updating document: ${updateError.message}`);
  }

  const embedding = await model.run(document, {
    mean_pool: true,
    normalize: true,
    dimensions: 1536,
  });

  const { error: insertError } = await supabase
    .from("document_sections")
    .insert({
      document_id: id,
      team_id,
      embedding,
    });

  if (insertError) {
    console.log(`Error inserting chunk: ${insertError.message}`);
  }

  return new Response("Document processed and embedded successfully", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
