"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { z } from "zod/v3";
import { useZodForm } from "@/hooks/use-zod-form";
import { useInvoiceEditorStore } from "@/store/invoice-editor";

export const invoiceTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().optional(),
  isDefault: z.boolean().optional(),
  title: z.string().optional(),
  customerLabel: z.string(),
  fromLabel: z.string(),
  invoiceNoLabel: z.string(),
  issueDateLabel: z.string(),
  dueDateLabel: z.string(),
  descriptionLabel: z.string(),
  priceLabel: z.string(),
  quantityLabel: z.string(),
  totalLabel: z.string(),
  totalSummaryLabel: z.string().optional(),
  vatLabel: z.string().optional(),
  subtotalLabel: z.string().optional(),
  taxLabel: z.string().optional(),
  discountLabel: z.string().optional(),
  paymentLabel: z.string(),
  noteLabel: z.string(),
  logoUrl: z.string().optional().nullable(),
  currency: z.string(),
  paymentDetails: z.any().nullable().optional(),
  fromDetails: z.any().nullable().optional(),
  size: z.enum(["a4", "letter"]),
  includeVat: z.boolean().optional(),
  includeTax: z.boolean().optional(),
  includeDiscount: z.boolean().optional(),
  includeDecimals: z.boolean().optional(),
  includePdf: z.boolean().optional(),
  includeUnits: z.boolean().optional(),
  includeQr: z.boolean().optional(),
  includeLineItemTax: z.boolean().optional(),
  lineItemTaxLabel: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
  vatRate: z.number().min(0).max(100).optional().nullable(),
  dateFormat: z.enum(["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd.MM.yyyy"]),
  deliveryType: z.enum(["create", "create_and_send", "scheduled", "recurring"]),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  paymentEnabled: z.boolean().optional(),
  paymentTermsDays: z.number().min(0).max(365).optional(),
  emailSubject: z.string().optional().nullable(),
  emailHeading: z.string().optional().nullable(),
  emailBody: z.string().optional().nullable(),
  emailButtonText: z.string().optional().nullable(),
});

export const lineItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  unit: z.string().optional(),
  price: z.number(),
  vat: z.number().min(0, "VAT must be at least 0").optional(),
  tax: z.number().min(0, "Tax must be at least 0").optional(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
});

export const recurringConfigSchema = z
  .object({
    frequency: z.enum([
      "weekly",
      "biweekly",
      "monthly_date",
      "monthly_weekday",
      "monthly_last_day",
      "quarterly",
      "semi_annual",
      "annual",
      "custom",
    ]),
    frequencyDay: z.number().nullable(),
    frequencyWeek: z.number().nullable(),
    frequencyInterval: z.number().nullable(),
    endType: z.enum(["never", "on_date", "after_count"]).nullable(),
    endDate: z.string().nullable(),
    endCount: z.number().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate frequencyDay is required for weekly frequency
    if (data.frequency === "weekly") {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of week is required for weekly frequency",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 0 || data.frequencyDay > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of week must be 0-6 (Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      }
    }

    // Validate frequencyDay is required for biweekly frequency
    if (data.frequency === "biweekly") {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of week is required for bi-weekly frequency",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 0 || data.frequencyDay > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of week must be 0-6 (Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      }
    }

    // monthly_last_day doesn't require frequencyDay

    // Frequencies that require frequencyDay as day of month (1-31)
    const dayOfMonthFrequencies = [
      "monthly_date",
      "quarterly",
      "semi_annual",
      "annual",
    ] as const;

    // Validate frequencyDay is required for day-of-month frequencies
    if (
      dayOfMonthFrequencies.includes(
        data.frequency as (typeof dayOfMonthFrequencies)[number],
      )
    ) {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of month is required for this frequency",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 1 || data.frequencyDay > 31) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of month must be 1-31",
          path: ["frequencyDay"],
        });
      }
    }

    // Validate frequencyDay and frequencyWeek are required for monthly_weekday frequency
    if (data.frequency === "monthly_weekday") {
      if (data.frequencyDay === null || data.frequencyDay === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of week is required for monthly weekday frequency",
          path: ["frequencyDay"],
        });
      } else if (data.frequencyDay < 0 || data.frequencyDay > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of week must be 0-6 (Sunday-Saturday)",
          path: ["frequencyDay"],
        });
      }

      if (data.frequencyWeek === null || data.frequencyWeek === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Week occurrence is required for monthly weekday frequency",
          path: ["frequencyWeek"],
        });
      } else if (data.frequencyWeek < 1 || data.frequencyWeek > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Week occurrence must be 1-5 (1st through 5th)",
          path: ["frequencyWeek"],
        });
      }
    }

    // Validate frequencyInterval is required when frequency is 'custom'
    if (data.frequency === "custom" && !data.frequencyInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Day interval is required for custom frequency",
        path: ["frequencyInterval"],
      });
    }

    // Validate endDate is required when endType is 'on_date'
    if (data.endType === "on_date" && !data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date is required when ending on a specific date",
        path: ["endDate"],
      });
    }

    // Validate endCount is required when endType is 'after_count'
    if (data.endType === "after_count" && !data.endCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice count is required when ending after a count",
        path: ["endCount"],
      });
    }
  });

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
  scheduledAt: z.string().nullable().optional(),
  recurringConfig: recurringConfigSchema.nullable().optional(),
  // Recurring series link (set when invoice is part of a recurring series)
  invoiceRecurringId: z.string().uuid().nullable().optional(),
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
    // @ts-expect-error
    defaultValues: defaultSettings,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      ...(defaultSettings ?? {}),
      ...(data ?? {}),
      // @ts-expect-error
      template: {
        ...(defaultSettings?.template ?? {}),
        ...(data?.template ?? {}),
      },
      customerId: data?.customerId ?? defaultSettings?.customerId ?? undefined,
    });

    // Signal that a reset happened. The auto-save effect will capture the
    // baseline snapshot on the first debounce tick — after all child effects
    // (Summary, etc.) have finished normalizing values.
    useInvoiceEditorStore.getState().markReset();
  }, [data, defaultSettings]);

  return <FormProvider {...form}>{children}</FormProvider>;
}
