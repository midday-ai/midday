import type { Context } from "@api/rest/types";
import { downloadFileSchema, downloadInvoiceSchema } from "@api/schemas/files";
import { createAdminClient } from "@api/services/supabase";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { getInvoiceById } from "@midday/db/queries";
import { verifyFileKey } from "@midday/encryption";
import { PdfTemplate, renderToStream } from "@midday/invoice";
import { verify } from "@midday/invoice/token";
import { download } from "@midday/supabase/storage";
import { HTTPException } from "hono/http-exception";
import { publicMiddleware } from "../../middleware";
import { withDatabase } from "../../middleware/db";
import { withFileAuth } from "../../middleware/file-auth";
import { withClientIp } from "../../middleware/ip";
import { getContentTypeFromFilename, normalizeAndValidatePath } from "./utils";

const app = new OpenAPIHono<Context>();

const errorResponseSchema = z.object({
  error: z.string(),
});

// Download file route - requires authentication
app.openapi(
  createRoute({
    method: "get",
    path: "/file",
    summary: "Download file from vault",
    operationId: "downloadFile",
    "x-speakeasy-name-override": "downloadFile",
    description:
      "Downloads a file from the vault storage bucket. Requires team file key (fk) query parameter for access.",
    tags: ["Files"],
    request: {
      query: downloadFileSchema,
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
    const { path, filename } = c.req.valid("query");
    const { normalizedPath } = normalizeAndValidatePath(path);

    const supabase = await createAdminClient();

    const { data, error } = await download(supabase, {
      bucket: "vault",
      path: normalizedPath,
    });

    if (error || !data) {
      throw new HTTPException(404, {
        message: error?.message || "File not found",
      });
    }

    // Try to get content type from blob, fallback to application/octet-stream
    const blob = await data.arrayBuffer();
    const contentType =
      data.type ||
      (filename
        ? getContentTypeFromFilename(filename)
        : "application/octet-stream");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cross-Origin-Resource-Policy": "cross-origin",
    };

    if (filename) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(blob, { headers });
  },
);

// Download invoice route - public when using invoice token, protected when using id
// Apply public middleware first, then conditionally apply auth if ID is used
const downloadInvoiceApp = new OpenAPIHono<Context>();

// Apply public middleware (database access)
downloadInvoiceApp.use(...publicMiddleware);

// Conditionally apply file key auth middleware if ID is provided
// When ID is used, authentication is required via fk (fileKey) query parameter
// When only invoice token is provided, it's public access (no auth middleware)
downloadInvoiceApp.use(async (c, next) => {
  const query = c.req.query();
  // If ID is provided, require file key authentication
  if (query.id) {
    const fk = query.fk;

    if (!fk) {
      throw new HTTPException(401, {
        message:
          "File key (fk) query parameter is required when using invoice ID.",
      });
    }

    // Verify file key and extract teamId
    const tokenTeamId = await verifyFileKey(fk);

    if (!tokenTeamId) {
      throw new HTTPException(401, {
        message: "Invalid file key.",
      });
    }

    // Set teamId in context for downstream handlers
    c.set("teamId", tokenTeamId);
  }
  // Otherwise, continue without auth requirement (public access via invoice token)
  return next();
});

downloadInvoiceApp.openapi(
  createRoute({
    method: "get",
    path: "/invoice",
    summary: "Download invoice PDF",
    operationId: "downloadInvoice",
    "x-speakeasy-name-override": "downloadInvoice",
    description:
      "Downloads an invoice as a PDF. Can be accessed with an invoice ID (requires team file key via fk query parameter) or invoice token (public access).",
    tags: ["Files"],
    request: {
      query: downloadInvoiceSchema,
    },
    responses: {
      200: {
        description: "Invoice PDF",
        content: {
          "application/pdf": {
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
  }),
  async (c) => {
    const db = c.get("db");
    const { id, token, preview, type } = c.req.valid("query");
    const isReceipt = type === "receipt";

    if (!id && !token) {
      throw new HTTPException(400, {
        message: "Either id or token must be provided",
      });
    }

    let invoiceData = null;

    if (id) {
      // Require authentication for ID-based access
      const teamId = c.get("teamId");
      if (!teamId) {
        throw new HTTPException(401, {
          message: "Authentication required when using invoice ID",
        });
      }

      invoiceData = await getInvoiceById(db, {
        id,
        teamId,
      });
    } else if (token) {
      // Public access with token - verify token and get invoice
      try {
        const { id: invoiceId } = (await verify(decodeURIComponent(token))) as {
          id: string;
        };

        if (!invoiceId) {
          throw new HTTPException(404, { message: "Invoice not found" });
        }

        invoiceData = await getInvoiceById(db, {
          id: invoiceId,
        });
      } catch (error) {
        // Re-throw HTTPException as-is (e.g., "Invoice not found" from line 253)
        if (error instanceof HTTPException) {
          throw error;
        }
        // Only replace error message for actual verification failures
        throw new HTTPException(404, { message: "Invalid token" });
      }
    }

    if (!invoiceData) {
      throw new HTTPException(404, { message: "Invoice not found" });
    }

    // For receipt, validate that invoice is paid
    if (isReceipt && invoiceData.status !== "paid") {
      throw new HTTPException(400, {
        message: "Receipt is only available for paid invoices",
      });
    }

    try {
      const stream = await renderToStream(
        await PdfTemplate(invoiceData, { isReceipt }),
      );

      // Convert stream to blob
      const blob = await new Response(stream as any).blob();

      const headers: Record<string, string> = {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store, max-age=0",
      };

      if (!preview) {
        const filename = isReceipt
          ? `receipt-${invoiceData.invoiceNumber}.pdf`
          : `${invoiceData.invoiceNumber}.pdf`;
        headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      }

      return new Response(blob, { headers });
    } catch (error: unknown) {
      throw new HTTPException(500, {
        message: `Failed to generate ${isReceipt ? "receipt" : "invoice"} PDF: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  },
);

// Mount download invoice route
app.route("/", downloadInvoiceApp);

export { app as downloadRouter };
