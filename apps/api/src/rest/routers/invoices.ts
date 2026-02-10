import type { Context } from "@api/rest/types";
import {
  deleteInvoiceResponseSchema,
  deleteInvoiceSchema,
  draftInvoiceRequestSchema,
  draftInvoiceResponseSchema,
  getInvoiceByIdSchema,
  getInvoicesSchema,
  getPaymentStatusResponseSchema,
  invoiceResponseSchema,
  invoiceSummaryResponseSchema,
  invoiceSummarySchema,
  invoicesResponseSchema,
  updateInvoiceRequestSchema,
  updateInvoiceResponseSchema,
} from "@api/schemas/invoice";
import { validateResponse } from "@api/utils/validate-response";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  deleteInvoice,
  draftInvoice,
  getCustomerById,
  getInvoiceById,
  getInvoiceSummary,
  getInvoices,
  getInvoiceTemplate,
  getNextInvoiceNumber,
  getPaymentStatus,
  isInvoiceNumberUsed,
  updateInvoice,
} from "@midday/db/queries";
import { calculateTotal } from "@midday/invoice/calculate";
import { transformCustomerToContent } from "@midday/invoice/utils";
import { decodeJobId, getQueue, triggerJob } from "@midday/job-client";
import { createLoggerWithContext } from "@midday/logger";
import { addDays } from "date-fns";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";
import { withRequiredScope } from "../middleware";

const logger = createLoggerWithContext("rest:invoices");

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all invoices",
    operationId: "listInvoices",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of invoices for the authenticated team.",
    tags: ["Invoices"],
    request: {
      query: getInvoicesSchema,
    },
    responses: {
      200: {
        description: "A list of invoices for the authenticated team.",
        content: {
          "application/json": {
            schema: invoicesResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { pageSize, cursor, sort, ...filter } = c.req.valid("query");

    const result = await getInvoices(db, {
      teamId,
      pageSize,
      cursor,
      sort,
      ...filter,
    });

    // Transform the data to add pdfUrl and previewUrl for each invoice
    const transformedResult = {
      ...result,
      data: result.data.map((invoice) => {
        const { token, ...invoiceWithoutToken } = invoice;

        // Calculate amounts if lineItems exist
        let calculatedAmounts = {};
        if (
          invoice.lineItems &&
          Array.isArray(invoice.lineItems) &&
          invoice.lineItems.length > 0
        ) {
          const {
            subTotal,
            total,
            vat: calculatedVAT,
            tax: calculatedTax,
          } = calculateTotal({
            lineItems: invoice.lineItems.map((item: any) => ({
              price: item.price,
              quantity: item.quantity,
            })),
            taxRate: (invoice.template as any)?.taxRate ?? 0,
            vatRate: (invoice.template as any)?.vatRate ?? 0,
            discount: invoice.discount ?? 0,
            includeVat: (invoice.template as any)?.includeVat ?? true,
            includeTax: (invoice.template as any)?.includeTax ?? true,
          });

          calculatedAmounts = {
            subtotal: subTotal,
            amount: total,
            vat: calculatedVAT,
            tax: calculatedTax,
          };
        }

        return {
          ...invoiceWithoutToken,
          ...calculatedAmounts,
          paymentDetails: invoice.paymentDetails
            ? JSON.stringify(invoice.paymentDetails)
            : null,
          customerDetails: invoice.customerDetails
            ? JSON.stringify(invoice.customerDetails)
            : null,
          fromDetails: invoice.fromDetails
            ? JSON.stringify(invoice.fromDetails)
            : null,
          noteDetails: invoice.noteDetails
            ? JSON.stringify(invoice.noteDetails)
            : null,
          topBlock: invoice.topBlock ? JSON.stringify(invoice.topBlock) : null,
          bottomBlock: invoice.bottomBlock
            ? JSON.stringify(invoice.bottomBlock)
            : null,
          pdfUrl: token
            ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/invoice?token=${token}`
            : null,
          previewUrl: token
            ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
            : null,
        };
      }),
    };

    return c.json(validateResponse(transformedResult, invoicesResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/payment-status",
    summary: "Payment status",
    description: "Get payment status for the authenticated team.",
    tags: ["Invoices"],
    responses: {
      200: {
        description: "Payment status for the authenticated team.",
        content: {
          "application/json": {
            schema: getPaymentStatusResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");

    const result = await getPaymentStatus(db, teamId);

    return c.json(validateResponse(result, getPaymentStatusResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/summary",
    summary: "Invoice summary",
    operationId: "getInvoiceSummary",
    "x-speakeasy-name-override": "summary",
    description: "Get summary of invoices for the authenticated team.",
    tags: ["Invoices"],
    request: {
      query: invoiceSummarySchema,
    },
    responses: {
      200: {
        description: "Summary of invoices for the authenticated team.",
        content: {
          "application/json": {
            schema: invoiceSummaryResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { statuses } = c.req.valid("query");

    const result = await getInvoiceSummary(db, {
      teamId,
      statuses,
    });

    return c.json(validateResponse(result, invoiceSummaryResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a invoice",
    operationId: "getInvoiceById",
    "x-speakeasy-name-override": "get",
    description:
      "Retrieve a invoice by its unique identifier for the authenticated team.",
    tags: ["Invoices"],
    request: {
      params: getInvoiceByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description:
          "Retrieve a invoice by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: invoiceResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getInvoiceById(db, {
      id,
      teamId,
    });

    if (!result) {
      throw new HTTPException(404, { message: "Invoice not found" });
    }

    // Add PDF download and preview URLs and serialize objects like tRPC does with superjson
    const { token, ...resultWithoutToken } = result;

    // Calculate amounts if lineItems exist
    let calculatedAmounts = {};
    if (
      result.lineItems &&
      Array.isArray(result.lineItems) &&
      result.lineItems.length > 0
    ) {
      const {
        subTotal,
        total,
        vat: calculatedVAT,
        tax: calculatedTax,
      } = calculateTotal({
        lineItems: result.lineItems.map((item: any) => ({
          price: item.price,
          quantity: item.quantity,
        })),
        taxRate: (result.template as any)?.taxRate ?? 0,
        vatRate: (result.template as any)?.vatRate ?? 0,
        discount: result.discount ?? 0,
        includeVat: (result.template as any)?.includeVat ?? true,
        includeTax: (result.template as any)?.includeTax ?? true,
      });

      calculatedAmounts = {
        subtotal: subTotal,
        amount: total,
        vat: calculatedVAT,
        tax: calculatedTax,
      };
    }

    const response = {
      ...resultWithoutToken,
      ...calculatedAmounts,
      paymentDetails: result.paymentDetails
        ? JSON.stringify(result.paymentDetails)
        : null,
      customerDetails: result.customerDetails
        ? JSON.stringify(result.customerDetails)
        : null,
      fromDetails: result.fromDetails
        ? JSON.stringify(result.fromDetails)
        : null,
      noteDetails: result.noteDetails
        ? JSON.stringify(result.noteDetails)
        : null,
      topBlock: result.topBlock ? JSON.stringify(result.topBlock) : null,
      bottomBlock: result.bottomBlock
        ? JSON.stringify(result.bottomBlock)
        : null,
      pdfUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/invoice?token=${token}`
        : null,
      previewUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
        : null,
    };

    return c.json(validateResponse(response, invoiceResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create an invoice",
    operationId: "createInvoice",
    "x-speakeasy-name-override": "create",
    description:
      "Create an invoice for the authenticated team. The behavior depends on deliveryType: 'create' generates and finalizes the invoice immediately, 'create_and_send' also sends it to the customer, 'scheduled' schedules the invoice for automatic processing at the specified date.",
    tags: ["Invoices"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: draftInvoiceRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description:
          "Invoice created successfully. Status depends on deliveryType: 'scheduled' for scheduled invoices, 'unpaid' for create/create_and_send.",
        content: {
          "application/json": {
            schema: draftInvoiceResponseSchema,
          },
        },
      },
      400: {
        description: "Bad request. Invalid input data or validation errors.",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Error message describing the validation failure",
                examples: [
                  "scheduledAt is required for scheduled delivery",
                  "scheduledAt must be in the future",
                  "Invoice number 'INV-001' is already used. Please provide a different invoice number or omit it to auto-generate one.",
                ],
              }),
            }),
          },
        },
      },
      404: {
        description: "Customer not found.",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Error message",
                example: "Customer not found",
              }),
            }),
          },
        },
      },
      409: {
        description: "Conflict. Invoice number already exists.",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Error message about the conflict",
                example:
                  "Invoice number 'INV-2024-001' is already used. Please provide a different invoice number or omit it to auto-generate one.",
              }),
            }),
          },
        },
      },
      500: {
        description: "Internal server error.",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Error message",
                example: "Failed to create invoice",
              }),
            }),
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const userId = c.get("session").user.id;
    const input = c.req.valid("json");

    // Generate invoice ID and number if not provided
    const invoiceId = uuidv4();
    const finalInvoiceNumber =
      input.invoiceNumber || (await getNextInvoiceNumber(db, teamId));

    // Check if the provided invoice number is already used
    if (input.invoiceNumber) {
      const isUsed = await isInvoiceNumberUsed(db, teamId, finalInvoiceNumber);
      if (isUsed) {
        throw new HTTPException(409, {
          message: `Invoice number '${finalInvoiceNumber}' is already used. Please provide a different invoice number or omit it to auto-generate one.`,
        });
      }
    }

    // Get template for default payment terms
    const template = await getInvoiceTemplate(db, teamId);
    const paymentTermsDays = template?.paymentTermsDays ?? 30;

    // Set default dates if not provided
    const issueDate = input.issueDate || new Date().toISOString();
    const dueDate =
      input.dueDate ||
      addDays(new Date(issueDate), paymentTermsDays).toISOString();

    // Fetch customer and generate customerDetails
    const customer = await getCustomerById(db, {
      id: input.customerId,
      teamId,
    });

    if (!customer) {
      throw new HTTPException(404, { message: "Customer not found" });
    }

    const customerDetails = transformCustomerToContent(customer);

    const result = await draftInvoice(db, {
      id: invoiceId,
      teamId,
      userId,
      invoiceNumber: finalInvoiceNumber,
      issueDate,
      dueDate,
      template: input.template,
      paymentDetails: input.paymentDetails,
      fromDetails: input.fromDetails,
      customerDetails: customerDetails ? JSON.stringify(customerDetails) : null,
      noteDetails: input.noteDetails,
      customerId: input.customerId,
      customerName: customer.name,
      logoUrl: input.logoUrl,
      vat: input.vat,
      tax: input.tax,
      discount: input.discount,
      topBlock: input.topBlock,
      bottomBlock: input.bottomBlock,
      amount: input.amount,
      lineItems: input.lineItems?.map((item) => ({
        ...item,
        name: JSON.stringify(item.name),
      })),
    });

    if (!result) {
      throw new HTTPException(500, { message: "Failed to create invoice" });
    }

    let finalResult = result;

    if (
      input.deliveryType === "create" ||
      input.deliveryType === "create_and_send"
    ) {
      // Update invoice status to unpaid (similar to tRPC)
      const updatedInvoice = await updateInvoice(db, {
        id: result.id,
        status: "unpaid",
        teamId,
        userId,
      });

      if (updatedInvoice) {
        finalResult = updatedInvoice;
      }

      // Trigger invoice generation (and sending if create_and_send)
      await triggerJob(
        "generate-invoice",
        {
          invoiceId: result.id,
          deliveryType: input.deliveryType,
        },
        "invoices",
      );
    } else if (input.deliveryType === "scheduled") {
      // Handle scheduled invoices
      if (!input.scheduledAt) {
        throw new HTTPException(400, {
          message: "scheduledAt is required for scheduled delivery",
        });
      }

      // Convert to Date object and validate it's in the future
      const scheduledDate = new Date(input.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new HTTPException(400, {
          message: "scheduledAt must be in the future",
        });
      }

      // Calculate delay in milliseconds from now
      const delayMs = scheduledDate.getTime() - now.getTime();

      // Create a scheduled job with delay
      const scheduledRun = await triggerJob(
        "schedule-invoice",
        {
          invoiceId: result.id,
        },
        "invoices",
        {
          delay: delayMs,
        },
      );

      if (!scheduledRun?.id) {
        throw new HTTPException(500, {
          message: "Failed to create scheduled job - no job ID returned",
        });
      }

      // Update the invoice with scheduling information
      const updatedInvoice = await updateInvoice(db, {
        id: result.id,
        status: "scheduled",
        scheduledAt: input.scheduledAt,
        scheduledJobId: scheduledRun.id,
        teamId,
        userId,
      });

      if (!updatedInvoice) {
        // Clean up the orphaned job before throwing
        try {
          const queue = getQueue("invoices");
          const { jobId: rawJobId } = decodeJobId(scheduledRun.id);
          const job = await queue.getJob(rawJobId);
          if (job) {
            await job.remove();
          }
        } catch {
          // Best effort cleanup - log but don't fail on cleanup errors
          logger.error("Failed to clean up orphaned scheduled job", {
            jobId: scheduledRun.id,
          });
        }

        throw new HTTPException(404, {
          message: "Invoice not found",
        });
      }

      finalResult = updatedInvoice;

      // Send notification (fire and forget)
      triggerJob(
        "notification",
        {
          type: "invoice_scheduled",
          teamId,
          invoiceId: result.id,
          invoiceNumber: finalResult.invoiceNumber!,
          scheduledAt: input.scheduledAt,
          customerName: finalResult.customerName ?? undefined,
        },
        "notifications",
      ).catch(() => {
        // Ignore notification errors - invoice was scheduled successfully
      });
    }

    // Add PDF download and preview URLs and serialize objects like tRPC does with superjson
    const { token, ...resultWithoutToken } = finalResult;
    const response = {
      ...resultWithoutToken,
      paymentDetails: result.paymentDetails
        ? JSON.stringify(result.paymentDetails)
        : null,
      customerDetails: result.customerDetails
        ? JSON.stringify(result.customerDetails)
        : null,
      fromDetails: result.fromDetails
        ? JSON.stringify(result.fromDetails)
        : null,
      noteDetails: result.noteDetails
        ? JSON.stringify(result.noteDetails)
        : null,
      topBlock: result.topBlock ? JSON.stringify(result.topBlock) : null,
      bottomBlock: result.bottomBlock
        ? JSON.stringify(result.bottomBlock)
        : null,
      pdfUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/invoice?token=${token}`
        : null,
      previewUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
        : null,
    };

    return c.json(validateResponse(response, draftInvoiceResponseSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "put",
    path: "/{id}",
    summary: "Update an invoice",
    operationId: "updateInvoice",
    "x-speakeasy-name-override": "update",
    description:
      "Update an invoice by its unique identifier for the authenticated team.",
    tags: ["Invoices"],
    request: {
      params: getInvoiceByIdSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: updateInvoiceRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Invoice updated successfully.",
        content: {
          "application/json": {
            schema: updateInvoiceResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const userId = c.get("session").user.id;
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    const result = await updateInvoice(db, {
      id,
      teamId,
      userId,
      ...input,
    });

    if (!result) {
      throw new HTTPException(404, { message: "Invoice not found" });
    }

    // Add PDF download and preview URLs and serialize objects like tRPC does with superjson
    const { token, ...resultWithoutToken } = result;
    const response = {
      ...resultWithoutToken,
      paymentDetails: result.paymentDetails
        ? JSON.stringify(result.paymentDetails)
        : null,
      customerDetails: result.customerDetails
        ? JSON.stringify(result.customerDetails)
        : null,
      fromDetails: result.fromDetails
        ? JSON.stringify(result.fromDetails)
        : null,
      noteDetails: result.noteDetails
        ? JSON.stringify(result.noteDetails)
        : null,
      topBlock: result.topBlock ? JSON.stringify(result.topBlock) : null,
      bottomBlock: result.bottomBlock
        ? JSON.stringify(result.bottomBlock)
        : null,
      pdfUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/invoice?token=${token}`
        : null,
      previewUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
        : null,
    };

    return c.json(validateResponse(response, updateInvoiceResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a invoice",
    operationId: "deleteInvoice",
    "x-speakeasy-name-override": "delete",
    description:
      "Delete an invoice by its unique identifier for the authenticated team. Only invoices with status 'draft' or 'canceled' can be deleted directly. If the invoice is not in one of these statuses, update its status to 'canceled' before attempting deletion.",
    tags: ["Invoices"],
    request: {
      params: deleteInvoiceSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description:
          "Delete a invoice by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: deleteInvoiceResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("invoices.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await deleteInvoice(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, deleteInvoiceResponseSchema));
  },
);

export const invoicesRouter = app;
