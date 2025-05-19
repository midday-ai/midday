"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  invoiceTemplateSchema,
  lineItemSchema,
} from "@api/trpc/routers/invoice/schema";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod";

export const invoiceFormSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  template: invoiceTemplateSchema,
  fromDetails: z.any(),
  customerDetails: z.any(),
  customerId: z.string().uuid(),
  customerName: z.string().optional(),
  paymentDetails: z.any(),
  noteDetails: z.any().optional(),
  dueDate: z.string(),
  issueDate: z.string(),
  invoiceNumber: z.string(),
  logoUrl: z.string().nullable().optional(),
  vat: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  subtotal: z.number().nullable().optional(),
  topBlock: z.any().nullable().optional(),
  bottomBlock: z.any().nullable().optional(),
  amount: z.number(),
  lineItems: z.array(lineItemSchema).min(1),
  token: z.string().optional(),
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
