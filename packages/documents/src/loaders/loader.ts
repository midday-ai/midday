import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { generateText } from "ai";
import { parseOfficeAsync } from "officeparser";
import { extractText, getDocumentProxy } from "unpdf";
import { cleanText, extractTextFromRtf } from "../utils";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

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

      // If we still don't have any text, let's use Gemini OCR
      if (document.length === 0) {
        const base64Content = Buffer.from(await content.arrayBuffer()).toString(
          "base64",
        );
        const dataUrl = `data:application/pdf;base64,${base64Content}`;

        try {
          const result = await generateText({
            model: google("gemini-3-pro-preview"),
            abortSignal: AbortSignal.timeout(60000), // 60s timeout for OCR
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "file",
                    data: dataUrl,
                    mediaType: "application/pdf",
                  },
                  {
                    type: "text",
                    text: "Extract all text from this PDF document and return it in markdown format.",
                  },
                ],
              },
            ],
            providerOptions: {
              google: {
                // Set thinking level to low to minimize latency and cost
                // Best for simple instruction following like OCR text extraction
                // See: https://ai.google.dev/gemini-api/docs/gemini-3?thinking=low
                thinkingLevel: "low",
                // Set media resolution to medium for PDFs (recommended by Gemini 3 docs)
                // medium (560 tokens) is optimal for document understanding
                // See: https://ai.google.dev/gemini-api/docs/gemini-3?thinking=low#media-resolution
                mediaResolution: "MEDIA_RESOLUTION_MEDIUM",
              },
            },
          });

          document = result.text ?? null;
        } catch (error) {
          console.error("Gemini OCR failed:", error);
          document = null;
        }
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
