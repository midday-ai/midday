import path from "node:path";
import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { pdf } from "pdf-to-img";
import { z } from "zod";
import "pdfjs-dist/build/pdf.worker.min.mjs";

export const generatePreview = schemaTask({
  id: "generate-preview",
  schema: z.object({
    file_path: z.array(z.string()),
  }),
  run: async ({ file_path }) => {
    const supabase = createClient();
    const filePathString = file_path.join("/");

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from("vault")
      .download(filePathString);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    if (!pdfBlob) {
      throw new Error("File not found in Supabase storage");
    }

    try {
      // Convert PDF blob to buffer
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

      // Convert buffer to base64 data URL
      const pdfDataUrl = `data:application/pdf;base64,${pdfBuffer.toString(
        "base64",
      )}`;

      const document = await pdf(pdfDataUrl, { scale: 2 });

      // Get the first page (page numbers are 1-based)
      if (document.length < 1) {
        throw new Error("PDF document is empty, cannot generate preview.");
      }
      const firstPageBuffer = await document.getPage(1);

      const parsedPath = path.parse(filePathString);
      const previewStoragePath = path.join(
        parsedPath.dir,
        `${parsedPath.name}.png`,
      );

      const { error: uploadError } = await supabase.storage
        .from("vault-preview")
        .upload(previewStoragePath, firstPageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload preview: ${uploadError.message}`);
      }
    } catch (error: unknown) {
      throw new Error(
        `PDF to PNG conversion failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },
});
