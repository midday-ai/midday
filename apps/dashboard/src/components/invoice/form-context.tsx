"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import type { RouterOutputs } from "@/trpc/routers/_app";
import {
  invoiceTemplateSchema,
  lineItemSchema,
} from "@/trpc/routers/invoice/schema";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

export const invoiceFormSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  template: invoiceTemplateSchema,
  from_details: z.any(),
  customer_details: z.any(),
  customer_id: z.string().uuid(),
  customer_name: z.string().optional(),
  payment_details: z.any(),
  note_details: z.any().optional(),
  due_date: z.string(),
  issue_date: z.string(),
  invoice_number: z.string(),
  logo_url: z.string().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  top_block: z.any().nullable().optional(),
  bottom_block: z.any().nullable().optional(),
  amount: z.number(),
  line_items: z.array(lineItemSchema).min(1),
  token: z.string().optional(),
  scheduled_at: z
    .string()
    .datetime()
    .optional()
    .superRefine((val, ctx) => {
      // If delivery_type is "scheduled", scheduled_at is required
      const deliveryType = ctx.parent?.template?.delivery_type;
      if (deliveryType === "scheduled" && !val) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Scheduled date and time is required when scheduling an invoice.",
          path: ["scheduled_at"],
        });
      }
    }),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

type FormContextProps = {
  children: React.ReactNode;
  data?: RouterOutputs["invoice"]["getById"];
  defaultSettings?: RouterOutputs["invoice"]["defaultSettings"];
};

export function FormContext({
  children,
  data,
  defaultSettings,
}: FormContextProps) {
  const form = useZodForm(invoiceFormSchema, {
    defaultValues: defaultSettings,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      ...defaultSettings,
      ...data,
      template: {
        ...defaultSettings?.template,
        ...data?.template,
      },
    });
  }, [data, defaultSettings]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
