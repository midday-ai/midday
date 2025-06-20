import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { Mistral } from "@mistralai/mistralai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { parseOfficeAsync } from "officeparser";
import { extractText, getDocumentProxy } from "unpdf";
import { cleanText, extractTextFromRtf } from "../utils";

// Currently, the Vercel AI SDK doesn't support base64-encoded PDF files
// And here we only have the Blob object
const mistralClient = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function loadDocument({
  content,
  metadata,
}: {
  content: Blob;
  metadata: { mimetype: string };
}) {
  let document: string | null = null;

  switch (metadata.mimetype) {
    case "application/pdf":
    case "application/x-pdf": {
      const arrayBuffer = await content.arrayBuffer();
      const pdf = await getDocumentProxy(arrayBuffer);

      const { text } = await extractText(pdf, {
        mergePages: true,
      });

      // Unsupported Unicode escape sequence
      document = text.replaceAll("\u0000", "");

      // If we still don't have any text, let's use Mistral
      if (document.length === 0) {
        const base64Content = Buffer.from(await content.arrayBuffer()).toString(
          "base64",
        );

        const ocrResponse = await mistralClient.ocr.process({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            documentUrl: `data:application/pdf;base64,${base64Content}`,
          },
          includeImageBase64: true,
        });

        document = ocrResponse.pages[0]?.markdown ?? null;
      }

      break;
    }

    case "text/csv": {
      const loader = new CSVLoader(content);

      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
      break;
    }

    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.oasis.opendocument.text":
    case "application/vnd.oasis.opendocument.spreadsheet":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.oasis.opendocument.presentation":
    case "application/docx": {
      const arrayBuffer = await content.arrayBuffer();
      const result = await parseOfficeAsync(Buffer.from(arrayBuffer));

      document = result;
      break;
    }

    case "text/markdown":
    case "text/plain": {
      const loader = new TextLoader(content);

      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
      break;
    }

    case "application/rtf": {
      const arrayBuffer = await content.arrayBuffer();
      const text = extractTextFromRtf(Buffer.from(arrayBuffer));

      document = text;
      break;
    }

    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    case "application/pptx": {
      const loader = new PPTXLoader(content);
      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
      break;
    }

    default: {
      throw new Error(`Unsupported file type: ${metadata.mimetype}`);
    }
  }

  return document ? cleanText(document) : null;
}
