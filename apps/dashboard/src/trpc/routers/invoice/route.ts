import { parseInputValue } from "@/components/invoice/utils";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { UTCDate } from "@date-fns/utc";
import { generateToken } from "@midday/invoice/token";
import type { sendInvoiceReminder } from "@midday/jobs/tasks/invoice/email/send-reminder";
import type { generateInvoice } from "@midday/jobs/tasks/invoice/operations/generate-invoice";
import { getCountryCode, getLocale, getTimezone } from "@midday/location";
import { currencies } from "@midday/location/currencies";
import {
  deleteInvoice,
  draftInvoice,
  duplicateInvoice,
  updateInvoice,
} from "@midday/supabase/mutations";
import {
  getInvoiceByIdQuery,
  getInvoiceSummaryQuery,
  getInvoiceTemplateQuery,
  getInvoicesQuery,
  getNextInvoiceNumberQuery,
  getPaymentStatusQuery,
  getTeamByIdQuery,
  getUserQuery,
  searchInvoiceNumberQuery,
} from "@midday/supabase/queries";
import { tasks } from "@trigger.dev/sdk/v3";
import { addMonths } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { draftInvoiceSchema } from "./schema";

const defaultTemplate = {
  title: "Invoice",
  customer_label: "To",
  from_label: "From",
  invoice_no_label: "Invoice No",
  issue_date_label: "Issue Date",
  due_date_label: "Due Date",
  description_label: "Description",
  price_label: "Price",
  quantity_label: "Quantity",
  total_label: "Total",
  total_summary_label: "Total",
  subtotal_label: "Subtotal",
  vat_label: "VAT",
  tax_label: "Tax",
  payment_label: "Payment Details",
  payment_details: undefined,
  note_label: "Note",
  logo_url: undefined,
  currency: "USD",
  from_details: undefined,
  size: "a4",
  include_vat: true,
  include_tax: true,
  discount_label: "Discount",
  include_discount: false,
  include_units: false,
  include_decimals: false,
  include_pdf: false,
  include_qr: true,
  date_format: "dd/MM/yyyy",
  tax_rate: 0,
  vat_rate: 0,
  delivery_type: "create",
  timezone: undefined,
  locale: undefined,
};

export const invoiceRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().nullable().optional(),
          sort: z.array(z.string(), z.string()).nullable().optional(),
          pageSize: z.number().optional(),
          filter: z
            .object({
              q: z.string().nullable().optional(),
              start: z.string().nullable().optional(),
              end: z.string().nullable().optional(),
              statuses: z.array(z.string()).nullable().optional(),
              customers: z.array(z.string()).nullable().optional(),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      return getInvoicesQuery(supabase, {
        teamId: teamId!,
        ...input,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx: { supabase } }) => {
      const { data } = await getInvoiceByIdQuery(supabase, input.id);

      return data;
    }),

  paymentStatus: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await getPaymentStatusQuery(supabase, teamId!);

      return data;
    },
  ),

  searchInvoiceNumber: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input, ctx: { supabase, teamId } }) => {
      const { data } = await searchInvoiceNumberQuery(supabase, {
        teamId: teamId!,
        query: input.query,
      });

      return data;
    }),

  invoiceSummary: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["draft", "overdue", "paid", "unpaid", "canceled"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await getInvoiceSummaryQuery(supabase, {
        teamId: teamId!,
        status: input?.status,
      });

      return data;
    }),

  defaultSettings: protectedProcedure.query(
    async ({ ctx: { supabase, teamId, session } }) => {
      const countryCode = await getCountryCode();

      // Fetch invoice number, template, and team details concurrently
      const [
        { data: nextInvoiceNumber },
        { data: template },
        { data: team },
        { data: user },
      ] = await Promise.all([
        getNextInvoiceNumberQuery(supabase, teamId!),
        getInvoiceTemplateQuery(supabase, teamId!),
        getTeamByIdQuery(supabase, teamId!),
        getUserQuery(supabase, session.user.id),
      ]);

      const currency =
        team?.base_currency ??
        currencies[countryCode as keyof typeof currencies] ??
        "USD";

      const timezone = user?.timezone ?? (await getTimezone());
      const locale = user?.locale ?? (await getLocale());

      // Default to letter size for US/CA, A4 for rest of world
      const size = ["US", "CA"].includes(countryCode) ? "letter" : "a4";

      // Default to include sales tax for countries where it's common
      const include_tax = ["US", "CA", "AU", "NZ", "SG", "MY", "IN"].includes(
        countryCode,
      );

      const savedTemplate = {
        title: template?.title ?? defaultTemplate.title,
        logo_url: template?.logo_url ?? defaultTemplate.logo_url,
        currency: template?.currency ?? defaultTemplate.currency,
        size: template?.size ?? defaultTemplate.size,
        include_tax: template?.include_tax ?? defaultTemplate.include_tax,
        include_vat: template?.include_vat ?? defaultTemplate.include_vat,
        include_discount:
          template?.include_discount ?? defaultTemplate.include_discount,
        include_decimals:
          template?.include_decimals ?? defaultTemplate.include_decimals,
        include_units: template?.include_units ?? defaultTemplate.include_units,
        include_qr: template?.include_qr ?? defaultTemplate.include_qr,
        include_pdf: template?.include_pdf ?? defaultTemplate.include_pdf,
        customer_label:
          template?.customer_label ?? defaultTemplate.customer_label,
        from_label: template?.from_label ?? defaultTemplate.from_label,
        invoice_no_label:
          template?.invoice_no_label ?? defaultTemplate.invoice_no_label,
        subtotal_label:
          template?.subtotal_label ?? defaultTemplate.subtotal_label,
        issue_date_label:
          template?.issue_date_label ?? defaultTemplate.issue_date_label,
        total_summary_label:
          template?.total_summary_label ?? defaultTemplate.total_summary_label,
        due_date_label:
          template?.due_date_label ?? defaultTemplate.due_date_label,
        discount_label:
          template?.discount_label ?? defaultTemplate.discount_label,
        description_label:
          template?.description_label ?? defaultTemplate.description_label,
        price_label: template?.price_label ?? defaultTemplate.price_label,
        quantity_label:
          template?.quantity_label ?? defaultTemplate.quantity_label,
        total_label: template?.total_label ?? defaultTemplate.total_label,
        vat_label: template?.vat_label ?? defaultTemplate.vat_label,
        tax_label: template?.tax_label ?? defaultTemplate.tax_label,
        payment_label: template?.payment_label ?? defaultTemplate.payment_label,
        note_label: template?.note_label ?? defaultTemplate.note_label,
        date_format: template?.date_format ?? defaultTemplate.date_format,
        delivery_type: template?.delivery_type ?? defaultTemplate.delivery_type,
        tax_rate: template?.tax_rate ?? defaultTemplate.tax_rate,
        vat_rate: template?.vat_rate ?? defaultTemplate.vat_rate,
        from_details: template?.from_details ?? defaultTemplate.from_details,
        payment_details:
          template?.payment_details ?? defaultTemplate.payment_details,
        timezone,
        locale,
      };

      return {
        // Default values first
        id: uuidv4(),
        currency: currency.toUpperCase(),
        status: "draft",
        size,
        include_tax,
        include_vat: !include_tax,
        include_discount: false,
        include_decimals: false,
        include_pdf: false,
        include_units: false,
        include_qr: true,
        invoice_number: nextInvoiceNumber,
        timezone,
        locale,
        from_details: savedTemplate.from_details,
        payment_details: savedTemplate.payment_details,
        customer_details: undefined,
        note_details: undefined,
        customer_id: undefined,
        issue_date: new UTCDate().toISOString(),
        due_date: addMonths(new UTCDate(), 1).toISOString(),
        line_items: [{ name: "", quantity: 0, price: 0, vat: 0 }],
        tax: undefined,
        token: undefined,
        discount: undefined,
        subtotal: undefined,
        top_block: undefined,
        bottom_block: undefined,
        amount: undefined,
        customer_name: undefined,
        logo_url: undefined,
        vat: undefined,
        template: savedTemplate,
      };
    },
  ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["paid", "canceled", "unpaid"]).optional(),
        paid_at: z.string().nullable().optional(),
        internal_note: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await updateInvoice(supabase, input);

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      const { data } = await deleteInvoice(supabase, {
        id: input.id,
      });

      return data;
    }),

  draft: protectedProcedure
    .input(draftInvoiceSchema)
    .mutation(async ({ input, ctx: { supabase, teamId, session } }) => {
      const token = input.token ?? (await generateToken(input.id));

      const { data } = await draftInvoice(supabase, {
        ...input,
        teamId: teamId!,
        userId: session.user.id,
        token,
        payment_details: parseInputValue(input.payment_details),
        from_details: parseInputValue(input.from_details),
        customer_details: parseInputValue(input.customer_details),
        note_details: parseInputValue(input.note_details),
      });

      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        deliveryType: z.enum(["create", "create_and_send"]),
      }),
    )
    .mutation(async ({ input, ctx: { supabase } }) => {
      // Update the invoice status to unpaid
      const { data } = await updateInvoice(supabase, {
        id: input.id,
        status: "unpaid",
      });

      if (!data) {
        throw new Error("Invoice not found");
      }

      await tasks.trigger<typeof generateInvoice>("generate-invoice", {
        invoiceId: data.id,
        deliveryType: input.deliveryType,
      });

      return data;
    }),

  remind: protectedProcedure
    .input(z.object({ id: z.string().uuid(), date: z.string() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      await tasks.trigger<typeof sendInvoiceReminder>("send-invoice-reminder", {
        invoiceId: input.id,
      });

      const { data } = await updateInvoice(supabase, {
        id: input.id,
        reminder_sent_at: input.date,
      });

      return data;
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx: { supabase, session, teamId } }) => {
      const { data: nextInvoiceNumber } = await getNextInvoiceNumberQuery(
        supabase,
        teamId!,
      );

      const token = await generateToken(input.id);
      const { data } = await duplicateInvoice(supabase, {
        id: input.id,
        token,
        userId: session.user.id,
        invoiceNumber: nextInvoiceNumber!,
      });

      return data;
    }),
});
