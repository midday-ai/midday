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
  protectedProcedure,
  publicProcedure,
} from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import { UTCDate } from "@date-fns/utc";
import {
  deleteInvoice,
  draftInvoice,
  duplicateInvoice,
  getCustomerById,
  getInvoiceById,
  getInvoiceSummary,
  getInvoiceTemplate,
  getInvoices,
  getNextInvoiceNumber,
  getPaymentStatus,
  getTeamById,
  getTrackerProjectById,
  getTrackerRecordsByRange,
  getUserById,
  searchInvoiceNumber,
  updateInvoice,
} from "@midday/db/queries";
import { verify } from "@midday/invoice/token";
import { transformCustomerToContent } from "@midday/invoice/utils";
import type {
  GenerateInvoicePayload,
  SendInvoiceReminderPayload,
} from "@midday/jobs/schema";
import { runs, tasks } from "@trigger.dev/sdk";
import { TRPCError } from "@trpc/server";
import { addMonths, format, parseISO } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const defaultTemplate = {
  title: "Invoice",
  customerLabel: "To",
  fromLabel: "From",
  invoiceNoLabel: "Invoice No",
  issueDateLabel: "Issue Date",
  dueDateLabel: "Due Date",
  descriptionLabel: "Description",
  priceLabel: "Price",
  quantityLabel: "Quantity",
  totalLabel: "Total",
  totalSummaryLabel: "Total",
  subtotalLabel: "Subtotal",
  vatLabel: "VAT",
  taxLabel: "Tax",
  paymentLabel: "Payment Details",
  paymentDetails: undefined,
  noteLabel: "Note",
  logoUrl: undefined,
  currency: "USD",
  fromDetails: undefined,
  size: "a4",
  includeVat: true,
  includeTax: true,
  discountLabel: "Discount",
  includeDiscount: false,
  includeUnits: false,
  includeDecimals: false,
  includePdf: false,
  sendCopy: false,
  includeQr: true,
  dateFormat: "dd/MM/yyyy",
  taxRate: 0,
  vatRate: 0,
  deliveryType: "create",
  timezone: undefined,
  locale: undefined,
};

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
        status: input?.status,
      });
    }),

  createFromTracker: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        dateFrom: z.string(),
        dateTo: z.string(),
      }),
    )
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      const { projectId, dateFrom, dateTo } = input;

      // Get project data and tracker entries
      const [projectData, trackerData] = await Promise.all([
        getTrackerProjectById(db, { id: projectId, teamId: teamId! }),
        getTrackerRecordsByRange(db, {
          teamId: teamId!,
          projectId,
          from: dateFrom,
          to: dateTo,
        }),
      ]);

      if (!projectData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "PROJECT_NOT_FOUND",
        });
      }

      // Check if project is billable
      if (!projectData.billable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PROJECT_NOT_BILLABLE",
        });
      }

      // Check if project has a rate
      if (!projectData.rate || projectData.rate <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PROJECT_NO_RATE",
        });
      }

      // Calculate total hours from tracker entries
      const allEntries = Object.values(trackerData.result || {}).flat();
      const totalDuration = allEntries.reduce(
        (sum, entry) => sum + (entry.duration || 0),
        0,
      );
      const totalHours = Math.round((totalDuration / 3600) * 100) / 100;

      if (totalHours === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "NO_TRACKED_HOURS",
        });
      }

      // Get default invoice settings and customer details
      const [nextInvoiceNumber, template, team, fullCustomer, user] =
        await Promise.all([
          getNextInvoiceNumber(db, teamId!),
          getInvoiceTemplate(db, teamId!),
          getTeamById(db, teamId!),
          projectData.customerId
            ? getCustomerById(db, {
                id: projectData.customerId,
                teamId: teamId!,
              })
            : null,
          getUserById(db, session?.user.id!),
        ]);

      const invoiceId = uuidv4();
      const currency = projectData.currency || team?.baseCurrency || "USD";
      const amount = totalHours * Number(projectData.rate);

      // Get user's preferred date format
      const userDateFormat =
        template?.dateFormat ?? user?.dateFormat ?? defaultTemplate.dateFormat;

      // Format the date range for the line item description
      // Use parseISO to avoid timezone shifts when parsing date strings
      const formattedDateFrom = format(parseISO(dateFrom), userDateFormat);
      const formattedDateTo = format(parseISO(dateTo), userDateFormat);
      const dateRangeDescription = `${projectData.name} (${formattedDateFrom} - ${formattedDateTo})`;

      // Create draft invoice with tracker data
      const templateData = {
        ...defaultTemplate,
        currency: currency.toUpperCase(),
        ...(template
          ? Object.fromEntries(
              Object.entries(template).map(([key, value]) => [
                key,
                value === null ? undefined : value,
              ]),
            )
          : {}),
        size: (template?.size === "a4" || template?.size === "letter"
          ? template.size
          : defaultTemplate.size) as "a4" | "letter",
        deliveryType: (template?.deliveryType === "create" ||
        template?.deliveryType === "create_and_send"
          ? template.deliveryType
          : defaultTemplate.deliveryType) as
          | "create"
          | "create_and_send"
          | undefined,
      };

      const invoiceData = {
        id: invoiceId,
        teamId: teamId!,
        userId: session?.user.id!,
        customerId: projectData.customerId,
        customerName: fullCustomer?.name,
        invoiceNumber: nextInvoiceNumber,
        currency: currency.toUpperCase(),
        amount,
        lineItems: [
          {
            name: dateRangeDescription,
            quantity: totalHours,
            price: Number(projectData.rate),
            vat: 0,
          },
        ],
        issueDate: new Date().toISOString(),
        dueDate: addMonths(new Date(), 1).toISOString(),
        template: templateData,
        fromDetails: (template?.fromDetails || null) as string | null,
        paymentDetails: (template?.paymentDetails || null) as string | null,
        customerDetails: fullCustomer
          ? JSON.stringify(transformCustomerToContent(fullCustomer))
          : null,
        noteDetails: null,
        topBlock: null,
        bottomBlock: null,
        vat: null,
        tax: null,
        discount: null,
        subtotal: null,
      };

      return draftInvoice(db, invoiceData);
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
        timezone,
        locale,
      };

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
        customerDetails: undefined,
        noteDetails: undefined,
        customerId: undefined,
        issueDate: new UTCDate().toISOString(),
        dueDate: addMonths(new UTCDate(), 1).toISOString(),
        lineItems: [{ name: "", quantity: 0, price: 0, vat: 0 }],
        tax: undefined,
        token: undefined,
        discount: undefined,
        subtotal: undefined,
        topBlock: undefined,
        bottomBlock: undefined,
        amount: undefined,
        customerName: undefined,
        logoUrl: undefined,
        vat: undefined,
        template: savedTemplate,
      };
    },
  ),

  update: protectedProcedure
    .input(updateInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return updateInvoice(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteInvoice(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  draft: protectedProcedure
    .input(draftInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return draftInvoice(db, {
        ...input,
        teamId: teamId!,
        userId: session?.user.id!,
        paymentDetails: parseInputValue(input.paymentDetails),
        fromDetails: parseInputValue(input.fromDetails),
        customerDetails: parseInputValue(input.customerDetails),
        noteDetails: parseInputValue(input.noteDetails),
      });
    }),

  create: protectedProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
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

        let scheduledJobId: string;

        if (existingInvoice?.scheduledJobId) {
          // Reschedule the existing job instead of creating a new one
          await runs.reschedule(existingInvoice.scheduledJobId, {
            delay: scheduledDate,
          });
          scheduledJobId = existingInvoice.scheduledJobId;
        } else {
          // Create a new scheduled job
          const scheduledRun = await tasks.trigger(
            "schedule-invoice",
            {
              invoiceId: input.id,
              scheduledAt: input.scheduledAt,
            },
            {
              delay: scheduledDate,
            },
          );

          scheduledJobId = scheduledRun.id;
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
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invoice not found",
          });
        }

        return data;
      }

      // Update the invoice status to unpaid for immediate delivery
      const data = await updateInvoice(db, {
        id: input.id,
        status: "unpaid",
        teamId: teamId!,
      });

      if (!data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await tasks.trigger("generate-invoice", {
        invoiceId: data.id,
        deliveryType: input.deliveryType,
      } satisfies GenerateInvoicePayload);

      return data;
    }),

  remind: protectedProcedure
    .input(remindInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      await tasks.trigger("send-invoice-reminder", {
        invoiceId: input.id,
      } satisfies SendInvoiceReminderPayload);

      return updateInvoice(db, {
        id: input.id,
        teamId: teamId!,
        reminderSentAt: input.date,
      });
    }),

  duplicate: protectedProcedure
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

  updateSchedule: protectedProcedure
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

      // Reschedule the existing job with the new date
      await runs.reschedule(invoice.scheduledJobId, {
        delay: scheduledDate,
      });

      // Update the scheduled date in the database
      const updatedInvoice = await updateInvoice(db, {
        id: input.id,
        scheduledAt: input.scheduledAt,
        teamId: teamId!,
      });

      return updatedInvoice;
    }),

  cancelSchedule: protectedProcedure
    .input(cancelScheduledInvoiceSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      // Get the current invoice to find the scheduled job ID
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

      // Cancel the scheduled job
      await runs.cancel(invoice.scheduledJobId);

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
});
