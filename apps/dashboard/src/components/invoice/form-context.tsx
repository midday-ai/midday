"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { UTCDate } from "@date-fns/utc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { addMonths } from "date-fns";
import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
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
  include_qr: true,
  date_format: "dd/MM/yyyy",
  tax_rate: 0,
  vat_rate: 0,
  delivery_type: "create",
  timezone: undefined,
};

type FormContextProps = {
  children: React.ReactNode;
};

export function FormContext({ children }: FormContextProps) {
  const trpc = useTRPC();
  const { invoiceId, type } = useInvoiceParams();
  const isOpen = Boolean(type === "create" || type === "edit");

  const { data: invoiceNumber } = useSuspenseQuery(
    trpc.invoice.getNextInvoiceNumber.queryOptions(),
  );

  const { data: draft } = useQuery(
    trpc.invoice.getById.queryOptions(
      {
        id: invoiceId!,
      },
      {
        enabled: !!invoiceId,
      },
    ),
  );

  const template = {};

  const defaultValues = {
    id: uuidv4(),
    template: {
      ...defaultTemplate,
      // NOTE: template overrides from fetched data should happen during reset/fetch, not here.
      //   size: defaultSettings.size ?? defaultTemplate.size,
      //   include_tax: defaultSettings.include_tax ?? defaultTemplate.include_tax,
      //   include_vat: defaultSettings.include_vat ?? defaultTemplate.include_vat,
      //   locale: defaultSettings.locale,
      //   // Use user timezone
      //   timezone: defaultSettings.timezone,
      size: "a4",
      include_tax: true,
      include_vat: true,
      locale: "en",
      timezone: "America/New_York",
    },
    // Use defaults directly, template is {} here.
    from_details: defaultTemplate.from_details,
    payment_details: defaultTemplate.payment_details,
    // Initialize potentially undefined/null fields explicitly
    customer_details: undefined,
    note_details: undefined,
    customer_id: undefined,
    // Dates need to match the schema type (string)
    issue_date: new UTCDate().toISOString(),
    due_date: addMonths(new UTCDate(), 1).toISOString(),
    invoice_number: invoiceNumber,
    // Ensure default line item matches schema structure
    line_items: [
      {
        name: "",
        quantity: 0,
        price: 0,
        vat: 0,
        tax: undefined,
        unit: undefined,
      },
    ],
    tax: undefined,
    token: undefined,
    discount: undefined,
    subtotal: undefined,
    top_block: undefined,
    bottom_block: undefined,
    // Add other potentially missing fields expected by schema if necessary
    amount: undefined,
    customer_name: undefined,
    logo_url: undefined,
    vat: undefined, // Explicitly add if needed, though schema has it under template too
  };

  // Explicitly type defaultValues to potentially catch errors earlier,
  // although useZodForm infers it. Match this type with formSchema's inferred type.
  // type FormSchemaType = z.infer<typeof formSchema>;
  // const typedDefaultValues: FormSchemaType = defaultValues;
  // NOTE: Using `any` temporarily if FormSchemaType is complex or causes issues here,
  // but ideally, defaultValues should strictly match the schema.
  const form = useZodForm(formSchema, {
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen]);

  useEffect(() => {
    if (draft) {
      form.reset(draft);
    }
  }, [draft]);

  // if (isLoading) {
  //   return null;
  // }

  return <FormProvider {...form}>{children}</FormProvider>;
}
