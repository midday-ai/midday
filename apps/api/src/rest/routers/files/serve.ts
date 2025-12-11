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

// Track active conversions for monitoring/debugging
// Note: We don't reject requests here - the worker pool handles queuing internally
// This counter is just for observability
let activeConversions = 0;

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

    // Set cache headers for images (long cache for immutable content)
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cross-Origin-Resource-Policy": "cross-origin",
    };

    // Add cache headers for images
    if (contentType.startsWith("image/")) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    }

    return new Response(blob, {
      headers,
    });
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/preview",
    summary: "Preview PDF as JPEG image",
    operationId: "previewFile",
    "x-speakeasy-name-override": "preview",
    description:
      "Converts the first page of a PDF file to a JPEG image for preview purposes. Requires team file key (fk) query parameter for access. Cloudflare CDN handles image resizing.",
    tags: ["Files"],
    request: {
      query: previewFileSchema,
    },
    responses: {
      200: {
        description: "JPEG image of the first page",
        content: {
          "image/jpeg": {
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
      503: {
        description: "Service unavailable - too many concurrent conversions",
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

    // Maximum file size for preview - matches worker pool configuration
    // This is checked here before downloading to save bandwidth
    const MAX_PREVIEW_SIZE = (() => {
      const envLimit = process.env.PDF_MAX_SIZE_MB
        ? Number.parseInt(process.env.PDF_MAX_SIZE_MB, 10) * 1024 * 1024
        : undefined;

      if (envLimit) {
        return envLimit;
      }

      // Match worker pool config: 30MB in production, 20MB in staging/dev
      return process.env.NODE_ENV === "production"
        ? 30 * 1024 * 1024
        : 20 * 1024 * 1024;
    })();

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from("vault")
      .download(normalizedPath);

    if (downloadError || !pdfBlob) {
      throw new HTTPException(500, { message: "Error downloading file" });
    }

    if (pdfBlob.type !== "application/pdf") {
      throw new HTTPException(400, { message: "File is not a PDF" });
    }

    // Check file size before processing to prevent memory issues and VM crashes
    const blobSize = pdfBlob.size;
    if (blobSize > MAX_PREVIEW_SIZE) {
      throw new HTTPException(413, {
        message: `File too large for preview. Maximum size is ${MAX_PREVIEW_SIZE / 1024 / 1024}MB. File size: ${(blobSize / 1024 / 1024).toFixed(2)}MB`,
      });
    }

    // Track active conversions for monitoring, but don't reject requests
    // The worker pool will handle queuing internally
    activeConversions++;

    try {
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const result = await getPdfImage(pdfBuffer);

      // Decrement counter when done (success or failure)
      activeConversions--;

      if (!result) {
        throw new HTTPException(500, {
          message: "Failed to convert PDF to image",
        });
      }

      // Return preview with aggressive HTTP caching headers
      // CDN and browsers will cache this, no need to store in storage
      return new Response(new Uint8Array(result.buffer), {
        headers: {
          "Content-Type": result.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Cross-Origin-Resource-Policy": "cross-origin",
        },
      });
    } catch (error: unknown) {
      // Always decrement counter on error
      activeConversions--;

      // Don't crash the VM - return a proper error response
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Re-throw HTTPExceptions (they're already properly formatted)
      if (error instanceof HTTPException) {
        throw error;
      }

      // Check for memory-related errors
      if (
        errorMessage.includes("out of memory") ||
        errorMessage.includes("ENOMEM") ||
        errorMessage.includes("allocation failed")
      ) {
        throw new HTTPException(507, {
          message: "File too large to process. Please try a smaller file.",
        });
      }

      throw new HTTPException(500, {
        message: `PDF to image conversion failed: ${errorMessage}`,
      });
    }
  },
);

export { app as serveRouter };
