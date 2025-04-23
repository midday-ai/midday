import { createRequire } from "node:module";
import path from "node:path";
import {
  GlobalWorkerOptions,
  getDocument,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { NodeCanvasFactory } from "./canvas-factory";
import "pdfjs-dist/build/pdf.worker.mjs";

// Resolve pdfjs-dist worker path directly
const require = createRequire(import.meta.url);
try {
  const workerSrcPath = require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
  );
  GlobalWorkerOptions.workerSrc = workerSrcPath;
  console.log("PDF.js worker source set to:", workerSrcPath);
} catch (error) {
  console.error(
    "Failed to resolve pdf.worker.mjs path. PDF rendering might fail.",
    error,
  );
}

const pdfjsPath = path.join(process.cwd(), "node_modules/pdfjs-dist");

export async function getPdfImage(data: ArrayBuffer) {
  // @ts-ignore
  await import("pdfjs-dist/build/pdf.worker.mjs");

  const canvasFactory = new NodeCanvasFactory();
  const loadingTask = getDocument({
    data,
    cMapPacked: true,
    isEvalSupported: false, // Generally recommended for Node.js
    cMapUrl: path.join(pdfjsPath, `cmaps${path.sep}`),
    standardFontDataUrl: path.join(pdfjsPath, `standard_fonts${path.sep}`),
  });

  try {
    const pdfDocument = await loadingTask.promise;
    console.log("# PDF document loaded.");

    // Use page 1 for the image
    const page = await pdfDocument.getPage(1);

    // Use a higher scale for better resolution
    const viewport = page.getViewport({ scale: 2.0 });

    // Use the explicitly created canvas factory
    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height,
    );

    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory,
    };

    // @ts-expect-error
    const renderTask = page.render(renderContext);
    await renderTask.promise;

    // Return image as PNG buffer
    const canvas = canvasAndContext.canvas;
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Error processing PDF:", error);
    return null;
  }
}
