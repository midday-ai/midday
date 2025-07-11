import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { NodeCanvasFactory } from "./canvas-factory";
import "pdfjs-dist/build/pdf.worker.mjs";

const pdfjsPath = path.join(process.cwd(), "node_modules/pdfjs-dist");

export async function getPdfImage(data: ArrayBuffer) {
  const canvasFactory = new NodeCanvasFactory();
  const loadingTask = getDocument({
    data,
    cMapPacked: true,
    isEvalSupported: false,
    cMapUrl: path.join(pdfjsPath, `cmaps${path.sep}`),
    standardFontDataUrl: path.join(pdfjsPath, `standard_fonts${path.sep}`),
  });

  try {
    const pdfDocument = await loadingTask.promise;

    // Use page 1 for the image
    const page = await pdfDocument.getPage(1);

    const viewport = page.getViewport({ scale: 2.0 });

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
  } catch {
    return null;
  }
}
