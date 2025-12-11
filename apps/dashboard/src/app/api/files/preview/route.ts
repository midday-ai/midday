import { getPdfImage } from "@/utils/pdf-to-img";
import { getSession } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const filePath = req.nextUrl.searchParams.get("filePath");

  if (!filePath) {
    return NextResponse.json(
      { error: "No file path provided" },
      { status: 400 },
    );
  }

  // Normalize path (remove 'vault/' prefix if present)
  let normalizedPath = filePath;
  if (normalizedPath.startsWith("vault/")) {
    normalizedPath = normalizedPath.substring("vault/".length);
  }

  // Extract teamId from path and validate format
  const pathParts = normalizedPath.split("/");
  const pathTeamId = pathParts[0];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!pathTeamId || !uuidRegex.test(pathTeamId)) {
    return NextResponse.json(
      {
        error:
          "Invalid file path format. Path must start with a valid teamId UUID.",
      },
      { status: 400 },
    );
  }

  // Authenticate using session
  const {
    data: { session },
  } = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Maximum file size for preview
  const MAX_PREVIEW_SIZE = (() => {
    const envLimit = process.env.PDF_MAX_SIZE_MB
      ? Number.parseInt(process.env.PDF_MAX_SIZE_MB, 10) * 1024 * 1024
      : undefined;

    if (envLimit) {
      return envLimit;
    }

    return process.env.NODE_ENV === "production"
      ? 30 * 1024 * 1024 // 30MB in production
      : 20 * 1024 * 1024; // 20MB in staging/dev
  })();

  // Download PDF from storage
  const { data: pdfBlob, error: downloadError } = await supabase.storage
    .from("vault")
    .download(normalizedPath);

  if (downloadError) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!pdfBlob) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Check file type
  if (pdfBlob.type !== "application/pdf") {
    return NextResponse.json({ error: "File is not a PDF" }, { status: 400 });
  }

  // Check file size
  const pdfBuffer = await pdfBlob.arrayBuffer();
  if (pdfBuffer.byteLength > MAX_PREVIEW_SIZE) {
    return NextResponse.json(
      {
        error: `PDF too large for preview: ${pdfBuffer.byteLength} bytes (max: ${MAX_PREVIEW_SIZE} bytes)`,
      },
      { status: 400 },
    );
  }

  try {
    // Convert PDF to image using legacy implementation
    const imageBuffer = await getPdfImage(pdfBuffer);

    if (!imageBuffer) {
      return NextResponse.json(
        { error: "Failed to convert PDF to image" },
        { status: 500 },
      );
    }

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { error: `PDF to PNG conversion failed: ${errorMessage}` },
      { status: 500 },
    );
  }
};
