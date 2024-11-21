"use client";

import {
  type InvoiceFormValues,
  type InvoiceTemplate,
  invoiceFormSchema,
} from "@/actions/invoice/schema";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { UTCDate } from "@date-fns/utc";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Settings } from "@midday/invoice/default";
import { createClient } from "@midday/supabase/client";
import { getDraftInvoiceQuery } from "@midday/supabase/queries";
import { addMonths } from "date-fns";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

const defaultTemplate: InvoiceTemplate = {
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
  id?: string | null;
  children: React.ReactNode;
  template: InvoiceTemplate;
  invoiceNumber: string;
  defaultSettings: Settings;
  isOpen: boolean;
};

export function FormContext({
  id,
  children,
  template,
  defaultSettings,
  isOpen,
  invoiceNumber,
}: FormContextProps) {
  const supabase = createClient();
  const { lineItems, currency } = useInvoiceParams();
  const [isLoading, setLoading] = useState(false);

  const defaultValues = {
    id: uuidv4(),
    template: {
      ...defaultTemplate,
      size: defaultSettings.size ?? defaultTemplate.size,
      include_tax: defaultSettings.include_tax ?? defaultTemplate.include_tax,
      include_vat: defaultSettings.include_vat ?? defaultTemplate.include_vat,
      locale: defaultSettings.locale,
      // Use user timezone
      timezone: defaultSettings.timezone,
      ...template,
    },
    customer_details: undefined,
    from_details: template.from_details ?? defaultTemplate.from_details,
    payment_details:
      template.payment_details ?? defaultTemplate.payment_details,
    note_details: undefined,
    customer_id: undefined,
    issue_date: new UTCDate(),
    due_date: addMonths(new UTCDate(), 1),
    invoice_number: invoiceNumber,
    line_items: [{ name: "", quantity: 0, price: 0, vat: 0 }],
    tax: undefined,
    token: undefined,
    discount: undefined,
    subtotal: undefined,
    status: "draft",
    top_block: undefined,
    bottom_block: undefined,
  };

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset(defaultValues);
    }
  }, [isOpen]);

  useEffect(() => {
    async function fetchInvoice() {
      const { data } = await getDraftInvoiceQuery(supabase, id);

      if (data) {
        form.reset({
          ...data,
          template: {
            ...defaultValues.template,
            ...data.template,
          },
        });
      }

      setLoading(false);
    }

    if (id) {
      setLoading(true);
      fetchInvoice();
    }
  }, [id, isOpen]);

  // These values comes from the tracker table
  useEffect(() => {
    if (lineItems) {
      form.setValue("line_items", lineItems);
    }
  }, [lineItems]);

  useEffect(() => {
    if (currency) {
      form.setValue("template.currency", currency);
    }
  }, [currency]);

  if (isLoading) {
    return null;
  }

  return <FormProvider {...form}>{children}</FormProvider>;
}
