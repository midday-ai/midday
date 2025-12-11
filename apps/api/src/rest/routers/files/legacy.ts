import type { Context } from "@api/rest/types";
import { previewFileSchema } from "@api/schemas/files";
import { createAdminClient } from "@api/services/supabase";
import { getPdfImage } from "@api/utils/pdf-to-img-legacy";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { withDatabase } from "../../middleware/db";
import { withFileAuth } from "../../middleware/file-auth";
import { withClientIp } from "../../middleware/ip";
import { normalizeAndValidatePath } from "./utils";

const app = new OpenAPIHono<Context>();

const errorResponseSchema = z.object({
  error: z.string(),
});

app.openapi(
  createRoute({
    method: "get",
    path: "/preview-legacy",
    summary: "Preview PDF as PNG image (Legacy Implementation)",
    operationId: "previewFileLegacy",
    description:
      "Legacy PDF to image conversion using pdfjs-dist directly. For testing/comparison purposes. Converts the first page of a PDF file to a PNG image. Requires team file key (fk) query parameter for access.",
    tags: ["Files"],
    request: {
      query: previewFileSchema,
    },
    responses: {
      200: {
        description: "PNG image of the first page",
        content: {
          "image/png": {
            schema: {
              type: "string",
              format: "binary",
            },
          },
        },
      },
      400: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      404: {
        description: "Not found",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
    middleware: [withClientIp, withDatabase, withFileAuth],
  }),
  async (c) => {
    const { filePath } = c.req.valid("query");
    const { normalizedPath } = normalizeAndValidatePath(filePath);

    const supabase = await createAdminClient();

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
      throw new HTTPException(404, {
        message: "File not found",
      });
    }

    if (!pdfBlob) {
      throw new HTTPException(404, {
        message: "File not found",
      });
    }

    // Check file type
    if (pdfBlob.type !== "application/pdf") {
      throw new HTTPException(400, {
        message: "File is not a PDF",
      });
    }

    // Check file size
    const pdfBuffer = await pdfBlob.arrayBuffer();
    if (pdfBuffer.byteLength > MAX_PREVIEW_SIZE) {
      throw new HTTPException(400, {
        message: `PDF too large for preview: ${pdfBuffer.byteLength} bytes (max: ${MAX_PREVIEW_SIZE} bytes)`,
      });
    }

    try {
      // Convert PDF to image using legacy implementation
      const imageBuffer = await getPdfImage(pdfBuffer);

      if (!imageBuffer) {
        throw new HTTPException(500, {
          message: "Failed to convert PDF to image",
        });
      }

      return new Response(imageBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new HTTPException(500, {
        message: `PDF to PNG conversion failed: ${errorMessage}`,
      });
    }
  },
);

export { app as legacyRouter };
