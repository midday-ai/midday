import {
  GlobalWorkerOptions,
  getDocument,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { NodeCanvasFactory } from "./canvas-factory";

// Set worker source using a relative path - assuming bundler includes it
// This might require adjustment based on build output.
GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";

export async function getPdfImage(data: ArrayBuffer) {
  const canvasFactory = new NodeCanvasFactory();
  const loadingTask = getDocument({
    data,
    cMapPacked: true,
    isEvalSupported: false, // Generally recommended for Node.js
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
      canvasFactory, // Pass factory to render context
    };

    // @ts-expect-error
    const renderTask = page.render(renderContext);
    await renderTask.promise;

    // Return image as PNG buffer
    const canvas = canvasAndContext.canvas;
    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Error processing PDF:", error);
    // Consider more specific error handling or re-throwing
    return null;
  } finally {
    // Clean up resources
    // loadingTask.destroy(); // This method might not exist on the task, check pdfDocument
    // pdfDocument?.destroy(); // Ensure cleanup if pdfDocument was loaded
  }
}
