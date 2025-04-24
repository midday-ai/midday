import { getPdfImage } from "@/utils/pdf-to-img";
import { createClient } from "@midday/supabase/server";
import type { NextRequest } from "next/server";

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

  if (pdfBlob.type !== "application/pdf") {
    return new Response("File is not a PDF", { status: 400 });
  }

  try {
    const pdfBuffer = await pdfBlob.arrayBuffer();
    const document = await getPdfImage(pdfBuffer);

    return new Response(document, {
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
