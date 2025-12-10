import type { Context } from "@api/rest/types";
import { previewFileSchema, proxyFileSchema } from "@api/schemas/files";
import { createAdminClient } from "@api/services/supabase";
import { getPdfImage } from "@api/utils/pdf-to-img";
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
    path: "/proxy",
    summary: "Proxy file from storage",
    operationId: "proxyFile",
    "x-speakeasy-name-override": "proxy",
    description:
      "Proxies a file from storage. Requires team file key (fk) query parameter for access.",
    tags: ["Files"],
    request: {
      query: proxyFileSchema,
    },
    responses: {
      200: {
        description: "File content",
        content: {
          "application/octet-stream": {
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

    // Download the file from storage
    const { data, error } = await supabase.storage
      .from("vault")
      .download(normalizedPath);

    if (error || !data) {
      throw new HTTPException(404, {
        message: error?.message || "File not found",
      });
    }

    // Get the blob and determine content type
    const blob = await data.arrayBuffer();
    const contentType = data.type || "application/octet-stream";

    return new Response(blob, {
      headers: {
        "Content-Type": contentType,
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/preview",
    summary: "Preview PDF as PNG image",
    operationId: "previewFile",
    "x-speakeasy-name-override": "preview",
    description:
      "Converts the first page of a PDF file to a PNG image for preview purposes. Requires team file key (fk) query parameter for access.",
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

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from("vault")
      .download(normalizedPath);

    if (downloadError || !pdfBlob) {
      throw new HTTPException(500, { message: "Error downloading file" });
    }

    if (pdfBlob.type !== "application/pdf") {
      throw new HTTPException(400, { message: "File is not a PDF" });
    }

    try {
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const imageBuffer = await getPdfImage(pdfBuffer);

      if (!imageBuffer) {
        throw new HTTPException(500, {
          message: "Failed to convert PDF to image",
        });
      }

      return new Response(new Uint8Array(imageBuffer), {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      });
    } catch (error: unknown) {
      throw new HTTPException(500, {
        message: `PDF to image conversion failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  },
);

export { app as serveRouter };
