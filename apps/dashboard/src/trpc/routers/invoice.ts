import { getCountryCode, getLocale, getTimezone } from "@midday/location";
import { currencies } from "@midday/location/currencies";
import {
  getInvoiceSummaryQuery,
  getInvoiceTemplatesQuery,
  getInvoicesQuery,
  getLastInvoiceNumberQuery,
  getPaymentStatusQuery,
} from "@midday/supabase/queries";
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
});
