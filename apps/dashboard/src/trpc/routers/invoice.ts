import { parseInputValue } from "@/components/invoice/utils";
import { UTCDate } from "@date-fns/utc";
import { generateToken } from "@midday/invoice/token";
import type { sendInvoiceReminder } from "@midday/jobs/tasks/invoice/email/send-reminder";
import { getCountryCode, getLocale, getTimezone } from "@midday/location";
import { currencies } from "@midday/location/currencies";
import {
  deleteInvoice,
  draftInvoice,
  updateInvoice,
} from "@midday/supabase/mutations";
import {
  getInvoiceByIdQuery,
  getInvoiceSummaryQuery,
  getInvoiceTemplatesQuery,
  getInvoicesQuery,
  getLastInvoiceNumberQuery,
  getPaymentStatusQuery,
} from "@midday/supabase/queries";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { createTRPCRouter } from "../init";

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

  invoiceNumber: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await getLastInvoiceNumberQuery(supabase, teamId!);

      return data;
    },
  ),

  invoiceTemplates: protectedProcedure.query(
    async ({ ctx: { supabase, teamId } }) => {
      const { data } = await getInvoiceTemplatesQuery(supabase, teamId!);

      return data;
    },
  ),

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

  defaultSettings: protectedProcedure
    .input(
      z.object({
        baseCurrency: z.string(),
        timezone: z.string(),
        locale: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const countryCode = await getCountryCode();

      const currency =
        input.baseCurrency ??
        currencies[countryCode as keyof typeof currencies] ??
        "USD";

      const timezone = input.timezone ?? (await getTimezone());
      const locale = input.locale ?? (await getLocale());

      // Default to letter size for US/CA, A4 for rest of world
      const size = ["US", "CA"].includes(countryCode) ? "letter" : "a4";

      // Default to include sales tax for countries where it's common
      const include_tax = ["US", "CA", "AU", "NZ", "SG", "MY", "IN"].includes(
        countryCode,
      );

      return {
        currency: currency.toUpperCase(),
        size,
        include_tax,
        include_vat: !include_tax,
        include_discount: false,
        include_decimals: false,
        include_units: false,
        include_qr: true,
        timezone,
        locale,
      };
    }),

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
    .input(
      z.object({
        id: z.string().uuid(),
        template: z.object({
          customer_label: z.string().optional(),
          title: z.string().optional(),
          from_label: z.string().optional(),
          invoice_no_label: z.string().optional(),
          issue_date_label: z.string().optional(),
          due_date_label: z.string().optional(),
          description_label: z.string().optional(),
          price_label: z.string().optional(),
          quantity_label: z.string().optional(),
          total_label: z.string().optional(),
          total_summary_label: z.string().optional(),
          vat_label: z.string().optional(),
          subtotal_label: z.string().optional(),
          tax_label: z.string().optional(),
          discount_label: z.string().optional(),
          timezone: z.string().optional(),
          payment_label: z.string().optional(),
          note_label: z.string().optional(),
          logo_url: z.string().optional().nullable(),
          currency: z.string().optional(),
          payment_details: z.string().optional().nullable(),
          from_details: z.string().optional().nullable(),
          date_format: z.string().optional(),
          include_vat: z.boolean().optional().optional(),
          include_tax: z.boolean().optional().optional(),
          include_discount: z.boolean().optional(),
          include_decimals: z.boolean().optional(),
          include_units: z.boolean().optional(),
          include_qr: z.boolean().optional(),
          tax_rate: z.number().min(0).max(100).optional(),
          vat_rate: z.number().min(0).max(100).optional(),
          size: z.enum(["a4", "letter"]).optional(),
          delivery_type: z.enum(["create", "create_and_send"]).optional(),
          locale: z.string().optional(),
        }),
        from_details: z.string().nullable().optional(),
        customer_details: z.string().nullable().optional(),
        customer_id: z.string().uuid().nullable().optional(),
        customer_name: z.string().nullable().optional(),
        payment_details: z.string().nullable().optional(),
        note_details: z.string().nullable().optional(),
        due_date: z.string(),
        issue_date: z.string(),
        invoice_number: z.string(),
        logo_url: z.string().optional().nullable(),
        vat: z.number().nullable().optional(),
        tax: z.number().nullable().optional(),
        discount: z.number().nullable().optional(),
        subtotal: z.number().nullable().optional(),
        top_block: z.any().nullable().optional(),
        bottom_block: z.any().nullable().optional(),
        amount: z.number().nullable().optional(),
        line_items: z
          .array(
            z.object({
              name: z.string().optional(),
              quantity: z
                .number()
                .min(0, "Quantity must be at least 0")
                .optional(),
              unit: z.string().optional().nullable(),
              price: z.number().safe().optional(),
              vat: z.number().min(0, "VAT must be at least 0").optional(),
              tax: z.number().min(0, "Tax must be at least 0").optional(),
            }),
          )
          .optional(),
        token: z.string().optional(),
      }),
    )
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
    .mutation(async ({ input, ctx: { supabase, teamId, session } }) => {}),

  remind: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx: { supabase } }) => {
      await tasks.trigger<typeof sendInvoiceReminder>("send-invoice-reminder", {
        invoiceId: input.id,
      });

      const { data } = await updateInvoice(supabase, {
        id: input.id,
        reminder_sent_at: new UTCDate().toISOString(),
      });

      return data;
    }),
});
