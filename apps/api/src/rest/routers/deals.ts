import type { Context } from "@api/rest/types";
import {
  deleteDealResponseSchema,
  deleteDealSchema,
  draftDealRequestSchema,
  draftDealResponseSchema,
  getDealByIdSchema,
  getDealsSchema,
  getPaymentStatusResponseSchema,
  dealResponseSchema,
  dealSummaryResponseSchema,
  dealSummarySchema,
  dealsResponseSchema,
  updateDealRequestSchema,
  updateDealResponseSchema,
} from "@api/schemas/deal";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  deleteDeal,
  draftDeal,
  getMerchantById,
  getDealById,
  getDealSummary,
  getDealTemplate,
  getDeals,
  getNextDealNumber,
  getPaymentStatus,
  isDealNumberUsed,
  updateDeal,
} from "@midday/db/queries";
import { calculateTotal } from "@midday/deal/calculate";
import { transformMerchantToContent } from "@midday/deal/utils";
import { decodeJobId, getQueue, triggerJob } from "@midday/job-client";
import { addDays } from "date-fns";
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all deals",
    operationId: "listDeals",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of deals for the authenticated team.",
    tags: ["Deals"],
    request: {
      query: getDealsSchema,
    },
    responses: {
      200: {
        description: "A list of deals for the authenticated team.",
        content: {
          "application/json": {
            schema: dealsResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("deals.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { pageSize, cursor, sort, ...filter } = c.req.valid("query");

    const result = await getDeals(db, {
      teamId,
      pageSize,
      cursor,
      sort,
      ...filter,
    });

    // Transform the data to add pdfUrl and previewUrl for each deal
    const transformedResult = {
      ...result,
      data: result.data.map((deal) => {
        const { token, ...dealWithoutToken } = deal;

        // Calculate amounts if lineItems exist
        let calculatedAmounts = {};
        if (
          deal.lineItems &&
          Array.isArray(deal.lineItems) &&
          deal.lineItems.length > 0
        ) {
          const {
            subTotal,
            total,
            vat: calculatedVAT,
            tax: calculatedTax,
          } = calculateTotal({
            lineItems: deal.lineItems.map((item: any) => ({
              price: item.price,
              quantity: item.quantity,
            })),
            taxRate: (deal.template as any)?.taxRate ?? 0,
            vatRate: (deal.template as any)?.vatRate ?? 0,
            discount: deal.discount ?? 0,
            includeVat: (deal.template as any)?.includeVat ?? true,
            includeTax: (deal.template as any)?.includeTax ?? true,
          });

          calculatedAmounts = {
            subtotal: subTotal,
            amount: total,
            vat: calculatedVAT,
            tax: calculatedTax,
          };
        }

        return {
          ...dealWithoutToken,
          ...calculatedAmounts,
          paymentDetails: deal.paymentDetails
            ? JSON.stringify(deal.paymentDetails)
            : null,
          merchantDetails: deal.merchantDetails
            ? JSON.stringify(deal.merchantDetails)
            : null,
          fromDetails: deal.fromDetails
            ? JSON.stringify(deal.fromDetails)
            : null,
          noteDetails: deal.noteDetails
            ? JSON.stringify(deal.noteDetails)
            : null,
          topBlock: deal.topBlock ? JSON.stringify(deal.topBlock) : null,
          bottomBlock: deal.bottomBlock
            ? JSON.stringify(deal.bottomBlock)
            : null,
          pdfUrl: token
            ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/deal?token=${token}`
            : null,
          previewUrl: token
            ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
            : null,
        };
      }),
    };

    return c.json(validateResponse(transformedResult, dealsResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/payment-status",
    summary: "Payment status",
    description: "Get payment status for the authenticated team.",
    tags: ["Deals"],
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
    middleware: [withRequiredScope("deals.read")],
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
    summary: "Deal summary",
    operationId: "getDealSummary",
    "x-speakeasy-name-override": "summary",
    description: "Get summary of deals for the authenticated team.",
    tags: ["Deals"],
    request: {
      query: dealSummarySchema,
    },
    responses: {
      200: {
        description: "Summary of deals for the authenticated team.",
        content: {
          "application/json": {
            schema: dealSummaryResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("deals.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { statuses } = c.req.valid("query");

    const result = await getDealSummary(db, {
      teamId,
      statuses,
    });

    return c.json(validateResponse(result, dealSummaryResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a deal",
    operationId: "getDealById",
    "x-speakeasy-name-override": "get",
    description:
      "Retrieve a deal by its unique identifier for the authenticated team.",
    tags: ["Deals"],
    request: {
      params: getDealByIdSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description:
          "Retrieve a deal by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: dealResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("deals.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await getDealById(db, {
      id,
      teamId,
    });

    if (!result) {
      throw new HTTPException(404, { message: "Deal not found" });
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
      merchantDetails: result.merchantDetails
        ? JSON.stringify(result.merchantDetails)
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
        ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/deal?token=${token}`
        : null,
      previewUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
        : null,
    };

    return c.json(validateResponse(response, dealResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create an deal",
    operationId: "createDeal",
    "x-speakeasy-name-override": "create",
    description:
      "Create an deal for the authenticated team. The behavior depends on deliveryType: 'create' generates and finalizes the deal immediately, 'create_and_send' also sends it to the merchant, 'scheduled' schedules the deal for automatic processing at the specified date.",
    tags: ["Deals"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: draftDealRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description:
          "Deal created successfully. Status depends on deliveryType: 'scheduled' for scheduled deals, 'unpaid' for create/create_and_send.",
        content: {
          "application/json": {
            schema: draftDealResponseSchema,
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
                  "Deal number 'INV-001' is already used. Please provide a different deal number or omit it to auto-generate one.",
                ],
              }),
            }),
          },
        },
      },
      404: {
        description: "Merchant not found.",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Error message",
                example: "Merchant not found",
              }),
            }),
          },
        },
      },
      409: {
        description: "Conflict. Deal number already exists.",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string().openapi({
                description: "Error message about the conflict",
                example:
                  "Deal number 'INV-2024-001' is already used. Please provide a different deal number or omit it to auto-generate one.",
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
                example: "Failed to create deal",
              }),
            }),
          },
        },
      },
    },
    middleware: [withRequiredScope("deals.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const userId = c.get("session").user.id;
    const input = c.req.valid("json");

    // Generate deal ID and number if not provided
    const dealId = uuidv4();
    const finalDealNumber =
      input.dealNumber || (await getNextDealNumber(db, teamId));

    // Check if the provided deal number is already used
    if (input.dealNumber) {
      const isUsed = await isDealNumberUsed(db, teamId, finalDealNumber);
      if (isUsed) {
        throw new HTTPException(409, {
          message: `Deal number '${finalDealNumber}' is already used. Please provide a different deal number or omit it to auto-generate one.`,
        });
      }
    }

    // Get template for default payment terms
    const template = await getDealTemplate(db, teamId);
    const paymentTermsDays = template?.paymentTermsDays ?? 30;

    // Set default dates if not provided
    const issueDate = input.issueDate || new Date().toISOString();
    const dueDate =
      input.dueDate ||
      addDays(new Date(issueDate), paymentTermsDays).toISOString();

    // Fetch merchant and generate merchantDetails
    const merchant = await getMerchantById(db, {
      id: input.merchantId,
      teamId,
    });

    if (!merchant) {
      throw new HTTPException(404, { message: "Merchant not found" });
    }

    const merchantDetails = transformMerchantToContent(merchant);

    const result = await draftDeal(db, {
      id: dealId,
      teamId,
      userId,
      dealNumber: finalDealNumber,
      issueDate,
      dueDate,
      template: input.template,
      paymentDetails: input.paymentDetails,
      fromDetails: input.fromDetails,
      merchantDetails: merchantDetails ? JSON.stringify(merchantDetails) : null,
      noteDetails: input.noteDetails,
      merchantId: input.merchantId,
      merchantName: merchant.name,
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
      throw new HTTPException(500, { message: "Failed to create deal" });
    }

    let finalResult = result;

    if (
      input.deliveryType === "create" ||
      input.deliveryType === "create_and_send"
    ) {
      // Update deal status to unpaid (similar to tRPC)
      const updatedDeal = await updateDeal(db, {
        id: result.id,
        status: "unpaid",
        teamId,
        userId,
      });

      if (updatedDeal) {
        finalResult = updatedDeal;
      }

      // Trigger deal generation (and sending if create_and_send)
      await triggerJob(
        "generate-deal",
        {
          dealId: result.id,
          deliveryType: input.deliveryType,
        },
        "deals",
      );
    } else if (input.deliveryType === "scheduled") {
      // Handle scheduled deals
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
        "schedule-deal",
        {
          dealId: result.id,
        },
        "deals",
        {
          delay: delayMs,
        },
      );

      if (!scheduledRun?.id) {
        throw new HTTPException(500, {
          message: "Failed to create scheduled job - no job ID returned",
        });
      }

      // Update the deal with scheduling information
      const updatedDeal = await updateDeal(db, {
        id: result.id,
        status: "scheduled",
        scheduledAt: input.scheduledAt,
        scheduledJobId: scheduledRun.id,
        teamId,
        userId,
      });

      if (!updatedDeal) {
        // Clean up the orphaned job before throwing
        try {
          const queue = getQueue("deals");
          const { jobId: rawJobId } = decodeJobId(scheduledRun.id);
          const job = await queue.getJob(rawJobId);
          if (job) {
            await job.remove();
          }
        } catch {
          // Best effort cleanup - log but don't fail on cleanup errors
          console.error(
            "Failed to clean up orphaned scheduled job:",
            scheduledRun.id,
          );
        }

        throw new HTTPException(404, {
          message: "Deal not found",
        });
      }

      finalResult = updatedDeal;

      // Send notification (fire and forget)
      triggerJob(
        "deal-notification",
        {
          type: "scheduled",
          teamId,
          dealId: result.id,
          dealNumber: finalResult.dealNumber!,
          scheduledAt: input.scheduledAt,
          merchantName: finalResult.merchantName ?? undefined,
        },
        "deals",
      ).catch(() => {
        // Ignore notification errors - deal was scheduled successfully
      });
    }

    // Add PDF download and preview URLs and serialize objects like tRPC does with superjson
    const { token, ...resultWithoutToken } = finalResult;
    const response = {
      ...resultWithoutToken,
      paymentDetails: result.paymentDetails
        ? JSON.stringify(result.paymentDetails)
        : null,
      merchantDetails: result.merchantDetails
        ? JSON.stringify(result.merchantDetails)
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
        ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/deal?token=${token}`
        : null,
      previewUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
        : null,
    };

    return c.json(validateResponse(response, draftDealResponseSchema), 201);
  },
);

app.openapi(
  createRoute({
    method: "put",
    path: "/{id}",
    summary: "Update an deal",
    operationId: "updateDeal",
    "x-speakeasy-name-override": "update",
    description:
      "Update an deal by its unique identifier for the authenticated team.",
    tags: ["Deals"],
    request: {
      params: getDealByIdSchema.pick({ id: true }),
      body: {
        content: {
          "application/json": {
            schema: updateDealRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Deal updated successfully.",
        content: {
          "application/json": {
            schema: updateDealResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("deals.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const userId = c.get("session").user.id;
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    const result = await updateDeal(db, {
      id,
      teamId,
      userId,
      ...input,
    });

    if (!result) {
      throw new HTTPException(404, { message: "Deal not found" });
    }

    // Add PDF download and preview URLs and serialize objects like tRPC does with superjson
    const { token, ...resultWithoutToken } = result;
    const response = {
      ...resultWithoutToken,
      paymentDetails: result.paymentDetails
        ? JSON.stringify(result.paymentDetails)
        : null,
      merchantDetails: result.merchantDetails
        ? JSON.stringify(result.merchantDetails)
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
        ? `${process.env.MIDDAY_DASHBOARD_URL}/api/download/deal?token=${token}`
        : null,
      previewUrl: token
        ? `${process.env.MIDDAY_DASHBOARD_URL}/i/${token}`
        : null,
    };

    return c.json(validateResponse(response, updateDealResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a deal",
    operationId: "deleteDeal",
    "x-speakeasy-name-override": "delete",
    description:
      "Delete an deal by its unique identifier for the authenticated team. Only deals with status 'draft' or 'canceled' can be deleted directly. If the deal is not in one of these statuses, update its status to 'canceled' before attempting deletion.",
    tags: ["Deals"],
    request: {
      params: deleteDealSchema.pick({ id: true }),
    },
    responses: {
      200: {
        description:
          "Delete a deal by its unique identifier for the authenticated team.",
        content: {
          "application/json": {
            schema: deleteDealResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("deals.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const { id } = c.req.valid("param");

    const result = await deleteDeal(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, deleteDealResponseSchema));
  },
);

export const dealsRouter = app;
