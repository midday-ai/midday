import {
  cancelScheduledInvoiceSchema,
  createInvoiceSchema,
  deleteInvoiceSchema,
  draftInvoiceSchema,
  duplicateInvoiceSchema,
  getInvoiceByIdSchema,
  getInvoiceByTokenSchema,
  getInvoicesSchema,
  invoiceSummarySchema,
  remindInvoiceSchema,
  searchInvoiceNumberSchema,
  updateInvoiceSchema,
  updateScheduledInvoiceSchema,
} from "@api/schemas/invoice";
import {
  createTRPCRouter,
  memberProcedure,
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import { UTCDate } from "@date-fns/utc";
import {
  deleteInvoice,
  draftInvoice,
  duplicateInvoice,
  getAverageDaysToPayment,
  getAverageInvoiceSize,
  getInactiveMerchantsCount,
  getInvoiceById,
  getInvoiceSummary,
  getInvoiceTemplate,
  getInvoices,
  getMerchantById,
  getMostActiveMerchant,
  getNewMerchantsCount,
  getNextInvoiceNumber,
  getPaymentStatus,
  getTeamById,
  getTopRevenueMerchant,
  getUserById,
  searchInvoiceNumber,
  updateInvoice,
} from "@midday/db/queries";
import { DEFAULT_TEMPLATE } from "@midday/invoice";
import { verify } from "@midday/invoice/token";
import { transformMerchantToContent } from "@midday/invoice/utils";
import { decodeJobId, getQueue, triggerJob } from "@midday/job-client";
import { TRPCError } from "@trpc/server";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

// Use the shared default template from @midday/invoice
const defaultTemplate = DEFAULT_TEMPLATE;

export const invoiceRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInvoicesSchema.optional())
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoices(db, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(getInvoiceByIdSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return getInvoiceById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  getInvoiceByToken: publicProcedure
    .input(getInvoiceByTokenSchema)
    .query(async ({ input, ctx: { db } }) => {
      const { id } = (await verify(decodeURIComponent(input.token))) as {
        id: string;
      };

      if (!id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return getInvoiceById(db, {
        id,
      });
    }),

  paymentStatus: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    return getPaymentStatus(db, teamId!);
  }),

  searchInvoiceNumber: protectedProcedure
    .input(searchInvoiceNumberSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      return searchInvoiceNumber(db, {
        teamId: teamId!,
        query: input.query,
      });
    }),

  invoiceSummary: protectedProcedure
    .input(invoiceSummarySchema.optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getInvoiceSummary(db, {
        teamId: teamId!,
        statuses: input?.statuses,
      });
    }),

  defaultSettings: protectedProcedure.query(
    async ({ ctx: { db, teamId, session, geo } }) => {
      // Fetch invoice number, template, and team details concurrently
      const [nextInvoiceNumber, template, team, user] = await Promise.all([
        getNextInvoiceNumber(db, teamId!),
        getInvoiceTemplate(db, teamId!),
        getTeamById(db, teamId!),
        getUserById(db, session?.user.id!),
      ]);

      const locale = user?.locale ?? geo?.locale ?? "en";
      const timezone = user?.timezone ?? geo?.timezone ?? "America/New_York";
      const currency =
        template?.currency ?? team?.baseCurrency ?? defaultTemplate.currency;
      const dateFormat =
        template?.dateFormat ?? user?.dateFormat ?? defaultTemplate.dateFormat;
      const logoUrl = template?.logoUrl ?? defaultTemplate.logoUrl;
      const countryCode = geo?.country ?? "US";

      // Default to letter size for US/CA, A4 for rest of world
      const size = ["US", "CA"].includes(countryCode) ? "letter" : "a4";

      // Default to include sales tax for countries where it's common
      const includeTax = ["US", "CA", "AU", "NZ", "SG", "MY", "IN"].includes(
        countryCode,
      );

      const savedTemplate = {
        id: template?.id,
        name: template?.name ?? "Default",
        isDefault: template?.isDefault ?? true,
        title: template?.title ?? defaultTemplate.title,
        logoUrl,
        currency,
        size: template?.size ?? defaultTemplate.size,
        includeTax: template?.includeTax ?? includeTax,
        includeVat: template?.includeVat ?? !includeTax,
        includeDiscount:
          template?.includeDiscount ?? defaultTemplate.includeDiscount,
        includeDecimals:
          template?.includeDecimals ?? defaultTemplate.includeDecimals,
        includeUnits: template?.includeUnits ?? defaultTemplate.includeUnits,
        includeQr: template?.includeQr ?? defaultTemplate.includeQr,
        includeLineItemTax:
          template?.includeLineItemTax ?? defaultTemplate.includeLineItemTax,
        lineItemTaxLabel:
          template?.lineItemTaxLabel ?? defaultTemplate.lineItemTaxLabel,
        includePdf: template?.includePdf ?? defaultTemplate.includePdf,
        sendCopy: template?.sendCopy ?? defaultTemplate.sendCopy,
        customerLabel: template?.customerLabel ?? defaultTemplate.customerLabel,
        fromLabel: template?.fromLabel ?? defaultTemplate.fromLabel,
        invoiceNoLabel:
          template?.invoiceNoLabel ?? defaultTemplate.invoiceNoLabel,
        subtotalLabel: template?.subtotalLabel ?? defaultTemplate.subtotalLabel,
        issueDateLabel:
          template?.issueDateLabel ?? defaultTemplate.issueDateLabel,
        totalSummaryLabel:
          template?.totalSummaryLabel ?? defaultTemplate.totalSummaryLabel,
        dueDateLabel: template?.dueDateLabel ?? defaultTemplate.dueDateLabel,
        discountLabel: template?.discountLabel ?? defaultTemplate.discountLabel,
        descriptionLabel:
          template?.descriptionLabel ?? defaultTemplate.descriptionLabel,
        priceLabel: template?.priceLabel ?? defaultTemplate.priceLabel,
        quantityLabel: template?.quantityLabel ?? defaultTemplate.quantityLabel,
        totalLabel: template?.totalLabel ?? defaultTemplate.totalLabel,
        vatLabel: template?.vatLabel ?? defaultTemplate.vatLabel,
        taxLabel: template?.taxLabel ?? defaultTemplate.taxLabel,
        paymentLabel: template?.paymentLabel ?? defaultTemplate.paymentLabel,
        noteLabel: template?.noteLabel ?? defaultTemplate.noteLabel,
        dateFormat,
        deliveryType: template?.deliveryType ?? defaultTemplate.deliveryType,
        taxRate: template?.taxRate ?? defaultTemplate.taxRate,
        vatRate: template?.vatRate ?? defaultTemplate.vatRate,
        fromDetails: template?.fromDetails ?? defaultTemplate.fromDetails,
        paymentDetails:
          template?.paymentDetails ?? defaultTemplate.paymentDetails,
        noteDetails: template?.noteDetails ?? defaultTemplate.noteDetails,
        timezone,
        locale,
        paymentEnabled:
          template?.paymentEnabled ?? defaultTemplate.paymentEnabled,
        paymentTermsDays: template?.paymentTermsDays ?? 30,
      };

      // Calculate due date based on payment terms (default 30 days)
      const paymentTermsDays = savedTemplate.paymentTermsDays ?? 30;

      return {
        // Default values first
        id: uuidv4(),
        currency,
        status: "draft",
        size,
        includeTax: savedTemplate?.includeTax ?? includeTax,
        includeVat: savedTemplate?.includeVat ?? !includeTax,
        includeDiscount: false,
        includeDecimals: false,
        includePdf: false,
        sendCopy: false,
        includeUnits: false,
        includeQr: true,
        invoiceNumber: nextInvoiceNumber,
        timezone,
        locale,
        fromDetails: savedTemplate.fromDetails,
        paymentDetails: savedTemplate.paymentDetails,
        merchantDetails: undefined,
        noteDetails: savedTemplate.noteDetails,
        merchantId: undefined,
        issueDate: new UTCDate().toISOString(),
        dueDate: addDays(new UTCDate(), paymentTermsDays).toISOString(),
        lineItems: [{ name: "", quantity: 0, price: 0, vat: 0 }],
        tax: undefined,
        token: undefined,
        discount: undefined,
        subtotal: undefined,
        topBlock: undefined,
        bottomBlock: undefined,
        amount: undefined,
        merchantName: undefined,
        logoUrl: undefined,
        vat: undefined,
        template: savedTemplate,
      };
    },
  ),

  update: memberProcedure
    .input(updateInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return updateInvoice(db, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
      });
    }),

  delete: memberProcedure
    .input(deleteInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteInvoice(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  draft: memberProcedure
    .input(draftInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      // Generate invoice number if not provided
      const invoiceNumber =
        input.invoiceNumber || (await getNextInvoiceNumber(db, teamId!));

      return draftInvoice(db, {
        ...input,
        invoiceNumber,
        teamId: teamId!,
        userId: session?.user.id!,
        paymentDetails: parseInputValue(input.paymentDetails),
        fromDetails: parseInputValue(input.fromDetails),
        merchantDetails: parseInputValue(input.merchantDetails),
        noteDetails: parseInputValue(input.noteDetails),
      });
    }),

  create: memberProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      // Handle different delivery types
      if (input.deliveryType === "scheduled") {
        if (!input.scheduledAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "scheduledAt is required for scheduled delivery",
          });
        }

        // Convert to Date object and validate it's in the future
        const scheduledDate = new Date(input.scheduledAt);
        const now = new Date();

        if (scheduledDate <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "scheduledAt must be in the future",
          });
        }

        // Check if this is an existing scheduled invoice
        const existingInvoice = await getInvoiceById(db, {
          id: input.id,
          teamId: teamId!,
        });

        let scheduledJobId: string | null = null;

        try {
          // Calculate delay in milliseconds from now
          const delayMs = scheduledDate.getTime() - now.getTime();

          // Create the new scheduled job FIRST to ensure we don't lose the job if creation fails
          const scheduledRun = await triggerJob(
            "schedule-invoice",
            {
              invoiceId: input.id,
            },
            "invoices",
            {
              delay: delayMs,
            },
          );

          if (!scheduledRun?.id) {
            throw new Error(
              "Failed to create scheduled job - no job ID returned",
            );
          }

          scheduledJobId = scheduledRun.id;

          // Only remove the old job AFTER successfully creating the new one
          // This ensures we never lose the scheduled job even if there are transient failures
          if (existingInvoice?.scheduledJobId) {
            const queue = getQueue("invoices");
            // Decode composite ID (format: "invoices:123") to get raw job ID for BullMQ
            const { jobId: rawJobId } = decodeJobId(
              existingInvoice.scheduledJobId,
            );
            const existingJob = await queue.getJob(rawJobId);
            if (existingJob) {
              await existingJob.remove().catch((err) => {
                // Log but don't fail - the old job will eventually be cleaned up or run (harmlessly)
                // since we've already created the new job and will update the invoice
                console.error("Failed to remove old scheduled job:", err);
              });
            }
          }
        } catch (error) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            cause: error,
          });
        }

        // Only update the invoice status to "scheduled" if we successfully created/rescheduled the job
        if (!scheduledJobId) {
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
          });
        }

        // Update the invoice with scheduling information
        const data = await updateInvoice(db, {
          id: input.id,
          status: "scheduled",
          scheduledAt: input.scheduledAt,
          scheduledJobId,
          teamId: teamId!,
        });

        if (!data) {
          // Clean up the orphaned job before throwing
          try {
            const queue = getQueue("invoices");
            const { jobId: rawJobId } = decodeJobId(scheduledJobId);
            const job = await queue.getJob(rawJobId);
            if (job) {
              await job.remove();
            }
          } catch (err) {
            console.error("Failed to clean up orphaned scheduled job:", err);
          }

          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found",
          });
        }

        // Fire and forget notification - don't block the response
        triggerJob(
          "invoice-notification",
          {
            type: "scheduled",
            teamId: teamId!,
            invoiceId: input.id,
            invoiceNumber: data.invoiceNumber!,
            scheduledAt: input.scheduledAt,
            merchantName: data.merchantName ?? undefined,
          },
          "invoices",
        ).catch(() => {
          // Ignore notification errors - invoice was scheduled successfully
        });

        return data;
      }

      const data = await updateInvoice(db, {
        id: input.id,
        status: "unpaid",
        teamId: teamId!,
        userId: session.user.id,
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await triggerJob(
        "generate-invoice",
        {
          invoiceId: data.id,
          deliveryType: input.deliveryType,
        },
        "invoices",
      );

      return data;
    }),

  remind: memberProcedure
    .input(remindInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      await triggerJob(
        "send-invoice-reminder",
        {
          invoiceId: input.id,
        },
        "invoices",
      );

      return updateInvoice(db, {
        id: input.id,
        teamId: teamId!,
        reminderSentAt: input.date,
      });
    }),

  duplicate: memberProcedure
    .input(duplicateInvoiceSchema)
    .mutation(async ({ input, ctx: { db, session, teamId } }) => {
      const nextInvoiceNumber = await getNextInvoiceNumber(db, teamId!);

      return duplicateInvoice(db, {
        id: input.id,
        userId: session?.user.id!,
        invoiceNumber: nextInvoiceNumber!,
        teamId: teamId!,
      });
    }),

  updateSchedule: memberProcedure
    .input(updateScheduledInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current invoice to find the old scheduled job ID
      const invoice = await getInvoiceById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!invoice || !invoice.scheduledJobId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled invoice not found",
        });
      }

      // Convert to Date object and validate it's in the future
      const scheduledDate = new Date(input.scheduledAt);
      const now = new Date();

      if (scheduledDate <= now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "scheduledAt must be in the future",
        });
      }

      // Calculate new delay
      const delayMs = scheduledDate.getTime() - now.getTime();

      // Create new scheduled job FIRST to ensure we don't lose the job if creation fails
      const scheduledRun = await triggerJob(
        "schedule-invoice",
        {
          invoiceId: input.id,
        },
        "invoices",
        {
          delay: delayMs,
        },
      );

      if (!scheduledRun?.id) {
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Failed to create scheduled job",
        });
      }

      // Update the scheduled date and job ID in the database
      const updatedInvoice = await updateInvoice(db, {
        id: input.id,
        scheduledAt: input.scheduledAt,
        scheduledJobId: scheduledRun.id,
        teamId: teamId!,
      });

      if (!updatedInvoice) {
        // Database update failed - clean up the newly created job to avoid orphans
        const queue = getQueue("invoices");
        const { jobId: newRawJobId } = decodeJobId(scheduledRun.id);
        const newJob = await queue.getJob(newRawJobId);
        if (newJob) {
          await newJob.remove().catch((err) => {
            console.error("Failed to clean up orphaned scheduled job:", err);
          });
        }

        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found or update failed",
        });
      }

      // Only remove the old job AFTER successfully creating the new one and updating the database
      // This ensures we never lose the scheduled job even if there are transient failures
      const queue = getQueue("invoices");
      // Decode composite ID (format: "invoices:123") to get raw job ID for BullMQ
      const { jobId: rawJobId } = decodeJobId(invoice.scheduledJobId);
      const existingJob = await queue.getJob(rawJobId);
      if (existingJob) {
        await existingJob.remove().catch((err) => {
          // Log but don't fail - the old job will be detected as stale by the processor
          // since it verifies job.id matches invoice.scheduledJobId before processing
          console.error("Failed to remove old scheduled job:", err);
        });
      }

      return updatedInvoice;
    }),

  cancelSchedule: memberProcedure
    .input(cancelScheduledInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current invoice to find the scheduled job ID
      const invoice = await getInvoiceById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scheduled invoice not found",
        });
      }

      if (invoice.scheduledJobId) {
        // Cancel the scheduled job by removing it from the queue
        const queue = getQueue("invoices");
        // Decode composite ID (format: "invoices:123") to get raw job ID for BullMQ
        const { jobId: rawJobId } = decodeJobId(invoice.scheduledJobId);
        const job = await queue.getJob(rawJobId);
        if (job) {
          await job.remove();
        }
      }

      // Update the invoice status back to draft and clear scheduling fields
      const updatedInvoice = await updateInvoice(db, {
        id: input.id,
        status: "draft",
        scheduledAt: null,
        scheduledJobId: null,
        teamId: teamId!,
      });

      return updatedInvoice;
    }),

  mostActiveMerchant: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getMostActiveMerchant(db, { teamId: teamId! });
    },
  ),

  inactiveMerchantsCount: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getInactiveMerchantsCount(db, { teamId: teamId! });
    },
  ),

  averageDaysToPayment: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getAverageDaysToPayment(db, { teamId: teamId! });
    },
  ),

  averageInvoiceSize: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getAverageInvoiceSize(db, { teamId: teamId! });
    },
  ),

  topRevenueMerchant: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getTopRevenueMerchant(db, { teamId: teamId! });
    },
  ),

  newMerchantsCount: protectedProcedure.query(
    async ({ ctx: { db, teamId } }) => {
      return getNewMerchantsCount(db, { teamId: teamId! });
    },
  ),
});
