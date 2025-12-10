import { pdf } from "pdf-to-img";

/**
 * Convert PDF buffer to PNG image buffer (first page only)
 * Uses pdf-to-img library which handles pdfjs-dist internally
 * Cloudflare will handle JPEG conversion and optimization if needed
 * @param data - PDF file as ArrayBuffer
 * @returns PNG image buffer or null if conversion fails
 */
export async function getPdfImage(data: ArrayBuffer): Promise<Buffer | null> {
  try {
    // Convert ArrayBuffer to Buffer for pdf-to-img
    const pdfBuffer = Buffer.from(data);

    // Create PDF document instance with scale for quality
    // Scale 2.0 = 2x resolution (good quality without being too large)
    const document = await pdf(pdfBuffer, {
      scale: 2.0,
    });

    // Get the first page as an image
    // pdf-to-img returns an async iterator, so we need to get the first item
    const iterator = document[Symbol.asyncIterator]();
    const firstPage = await iterator.next();

    if (firstPage.done || !firstPage.value) {
      console.error("PDF has no pages or failed to render first page");
      return null;
    }

    return firstPage.value;
  } catch (error) {
    console.error("PDF to image conversion error:", error);
    return null;
  }
}
