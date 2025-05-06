import {
  type Canvas,
  type CanvasRenderingContext2D,
  createCanvas,
} from "canvas";

/**
 * Factory for creating canvas elements in a Node.js environment.
 * This is required by pdfjs-dist when running outside a browser.
 */
export class NodeCanvasFactory {
  /**
   * Creates a canvas element and its 2D rendering context.
   * @param width - The width of the canvas.
   * @param height - The height of the canvas.
   * @returns An object containing the canvas and its context.
   */
  create(
    width: number,
    height: number,
  ): { canvas: Canvas; context: CanvasRenderingContext2D } {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return {
      canvas,
      context,
    };
  }

  /**
   * Resets the canvas and context for reuse.
   * @param canvasAndContext - The canvas and context object to reset.
   * @param width - The new width.
   * @param height - The new height.
   */
  reset(
    canvasAndContext: { canvas: Canvas; context: CanvasRenderingContext2D },
    width: number,
    height: number,
  ): void {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    } else {
      // Handle case where canvas might not exist (though create should always provide one)
    }
    // Additional reset logic like clearing transforms might be needed depending on usage
    // canvasAndContext.context.setTransform(1, 0, 0, 1, 0, 0);
    // canvasAndContext.context.clearRect(0, 0, width, height);
  }

  /**
   * Destroys the canvas resources.
   * pdf.js specific interface method.
   * @param canvasAndContext - The canvas and context object to destroy.
   */
  destroy(canvasAndContext: {
    canvas: Canvas;
    context: CanvasRenderingContext2D;
  }): void {
    if (canvasAndContext.canvas) {
      // Zeroing the width and height is a way to release memory resources
      // associated with the canvas in the C++ backend of node-canvas.
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      // canvasAndContext.canvas = null; // Not needed as per node-canvas recommendations
      // canvasAndContext.context = null;
    }
  }
}
