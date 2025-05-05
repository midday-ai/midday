"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import type { RouterOutputs } from "@/trpc/routers/_app";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
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
  status: z.enum(["draft", "sent", "paid", "overdue", "canceled"]).optional(),
  line_items: z
    .array(
      z.object({
        name: z.string().optional(),
        quantity: z.number().min(0, "Quantity must be at least 0").optional(),
        unit: z.string().optional().nullable(),
        price: z.number().safe().optional(),
        vat: z.number().min(0, "VAT must be at least 0").optional(),
        tax: z.number().min(0, "Tax must be at least 0").optional(),
      }),
    )
    .optional(),
  token: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof formSchema>;

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
  const form = useZodForm(formSchema, {
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
