import { createClient } from "@midday/supabase/server";
import type { NextRequest } from "next/server";
import { pdf } from "pdf-to-img";

export async function GET(request: NextRequest) {
  const supabase = await createClient({ admin: true });
  const { searchParams } = new URL(request.url);
  let filePath = searchParams.get("filePath");

  if (!filePath) {
    return new Response("No file path provided", { status: 400 });
  }

  // Remove 'vault/' prefix if it exists
  if (filePath.startsWith("vault/")) {
    filePath = filePath.substring("vault/".length);
  }

  const { data: pdfBlob, error: downloadError } = await supabase.storage
    .from("vault")
    .download(filePath);

  if (downloadError) {
    return new Response("Error downloading file", { status: 500 });
  }

  try {
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
    const document = await pdf(pdfBuffer, { scale: 2 });

    // Get the first page (page numbers are 1-based)
    if (document.length < 1) {
      throw new Error("PDF document is empty, cannot generate preview.");
    }

    const firstPageBuffer = await document.getPage(1);

    return new Response(firstPageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    throw new Error(
      `PDF to PNG conversion failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
