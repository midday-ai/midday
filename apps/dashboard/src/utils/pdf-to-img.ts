import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// const pdfjsPath = path.dirname(
//   createRequire(import.meta.url).resolve("pdfjs-dist/package.json"),
// );

export async function getPdfImage(data: string) {
  const loadingTask = getDocument({
    data,
    // standardFontDataUrl: path.join(pdfjsPath, `standard_fonts${path.sep}`),
    // cMapUrl: path.join(pdfjsPath, `cmaps${path.sep}`),
    cMapPacked: true,
  });

  try {
    const pdfDocument = await loadingTask.promise;
    console.log("# PDF document loaded.");

    const page = await pdfDocument.getPage(1);

    const canvasFactory = pdfDocument.canvasFactory;
    const viewport = page.getViewport({ scale: 2.0 });

    const canvasAndContext = canvasFactory.create(
      viewport.width,
      viewport.height,
    );

    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
    };

    const renderTask = page.render(renderContext);
    await renderTask.promise;

    return canvasAndContext.canvas.toBuffer("image/png");
  } catch (error) {
    console.error(error);
    return null;
  }
}
