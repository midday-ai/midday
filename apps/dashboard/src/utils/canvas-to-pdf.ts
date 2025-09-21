"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface CanvasPdfOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  padding?: number;
  theme?: string;
}

/**
 * Simple PDF generation from canvas content
 */
export async function generateCanvasPdf(
  options: CanvasPdfOptions = {},
): Promise<void> {
  const {
    filename = "report.pdf",
    quality = 1.0,
    scale = 4,
    padding = 10,
    theme,
  } = options;

  const backgroundColor = theme === "dark" ? "#0c0c0c" : "#ffffff";
  const backgroundRgb =
    theme === "dark" ? { r: 12, g: 12, b: 12 } : { r: 255, g: 255, b: 255 };

  try {
    // Find the canvas content
    const canvasContent = getCanvasContent();
    if (!canvasContent) {
      throw new Error("Canvas content not found");
    }

    // Capture the content as is, without any modifications
    const canvas = await html2canvas(canvasContent, {
      scale,
      backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
      removeContainer: true,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        // Inject fonts and fix chart text rendering

        // Apply font directly to all SVG text elements
        const allTextElements = clonedDoc.querySelectorAll(
          "svg text, svg tspan",
        );

        for (const element of allTextElements) {
          (element as HTMLElement).style.fontFamily =
            "Hedvig Letters Sans, system-ui, sans-serif";
          (element as HTMLElement).style.fontSize = "10px";
        }

        // Hide elements marked for PDF hiding
        const hideElements = clonedDoc.querySelectorAll(
          '[data-hide-in-pdf="true"]',
        );

        for (const element of hideElements) {
          (element as HTMLElement).style.display = "none";
        }
      },
    });

    // Create PDF with the captured content
    await createPdfFromCanvas(canvas, {
      filename,
      quality,
      padding,
      backgroundRgb,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF from canvas");
  }
}

/**
 * Creates a PDF from a canvas with proper sizing
 */
async function createPdfFromCanvas(
  canvas: HTMLCanvasElement,
  options: {
    filename: string;
    quality: number;
    padding: number;
    backgroundRgb: { r: number; g: number; b: number };
  },
): Promise<void> {
  // Use JPEG for better compression while maintaining quality
  const imgData = canvas.toDataURL("image/jpeg", options.quality);

  // Calculate dimensions
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 dimensions
  const a4Width = 210;
  const a4Height = 297;

  // Calculate scale to fit width
  const scale = (a4Width - options.padding * 2) / imgWidth;
  const scaledWidth = imgWidth * scale;
  const scaledHeight = imgHeight * scale;

  // Create PDF with enough height for all content
  const pdfHeight = Math.max(scaledHeight + options.padding * 2, a4Height);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [a4Width, pdfHeight],
  });

  // Add background
  pdf.setFillColor(
    options.backgroundRgb.r,
    options.backgroundRgb.g,
    options.backgroundRgb.b,
  );
  pdf.rect(0, 0, a4Width, pdfHeight, "F");

  // Add the image
  pdf.addImage(
    imgData,
    "JPEG",
    options.padding,
    options.padding,
    scaledWidth,
    scaledHeight,
  );

  // Add metadata
  pdf.setProperties({
    title: "Canvas Report",
    subject: "Generated from Midday Dashboard",
    author: "Midday",
    creator: "Midday Dashboard",
  });

  pdf.save(options.filename);
}

/**
 * Get the canvas content element
 */
function getCanvasContent(): HTMLElement | null {
  const selectors = ["[data-canvas-content]"];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.offsetHeight > 0 && element.offsetWidth > 0) {
      return element;
    }
  }

  console.warn("Canvas content not found");
  return null;
}
