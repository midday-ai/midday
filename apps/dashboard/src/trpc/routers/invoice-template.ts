import { parseInputValue } from "@/components/invoice/utils";
import { updateInvoiceTemplate } from "@midday/supabase/mutations";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";

export const invoiceTemplateRouter = createTRPCRouter({
  upsert: protectedProcedure
    .input(
      z.object({
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
        date_format: z
          .enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"])
          .optional(),
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
    )
    .mutation(async ({ ctx: { supabase, teamId }, input }) => {
      const { data } = await updateInvoiceTemplate(supabase, {
        ...input,
        teamId: teamId!,
        from_details: parseInputValue(input.from_details),
        payment_details: parseInputValue(input.payment_details),
      });

      return data;
    }),
});
