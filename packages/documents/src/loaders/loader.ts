import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { extractText, getDocumentProxy } from "unpdf";

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
    case "application/x-pdf":
    case "application/octet-stream": {
      const arrayBuffer = await content.arrayBuffer();
      const pdf = await getDocumentProxy(arrayBuffer);

      const { text } = await extractText(pdf, {
        mergePages: true,
      });

      // Unsupported Unicode escape sequence
      document = text.replaceAll("\u0000", "");

      break;
    }

    case "text/csv": {
      const loader = new CSVLoader(content);

      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
      break;
    }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/docx": {
      const loader = new DocxLoader(content);
      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));

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
    case "application/epub+zip": {
      const text = await content.text();
      const loader = new EPubLoader(text);

      document = await loader
        .load()
        .then((docs) => docs.map((doc) => doc.pageContent).join("\n"));
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

  return document;
}
