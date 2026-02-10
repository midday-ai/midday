import { extractText, getDocumentProxy } from "unpdf";

const MAX_TEXT_LENGTH = 50_000; // Limit text length for very large PDFs

/**
 * Extract text from PDF using unpdf
 * @param pdfUrl - Signed URL or direct URL to PDF
 * @param pdfBuffer - Optional PDF buffer (if already downloaded)
 * @returns Extracted text string or null if extraction fails
 */
export async function extractTextFromPdf(
  pdfUrl: string,
  pdfBuffer?: ArrayBuffer,
): Promise<string | null> {
  try {
    let buffer: ArrayBuffer;

    // Download PDF if buffer not provided
    if (!pdfBuffer) {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download PDF: ${response.status} ${response.statusText}`,
        );
      }
      buffer = await response.arrayBuffer();
    } else {
      buffer = pdfBuffer;
    }

    // Load PDF document using unpdf
    const pdf = await getDocumentProxy(new Uint8Array(buffer));

    // Extract text from all pages using unpdf's extractText function
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || !text.trim()) {
      return null;
    }

    // Limit text length if PDF is extremely large
    let extractedText = text.trim();
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.substring(0, MAX_TEXT_LENGTH);
    }

    return extractedText;
  } catch (_error) {
    // Return null on any error (corrupted PDF, image-based PDF, etc.)
    return null;
  }
}
