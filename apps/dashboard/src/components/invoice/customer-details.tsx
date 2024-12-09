"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/invoice/editor";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import type { JSONContent } from "@tiptap/react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectCustomer } from "../select-customer";
import { LabelInput } from "./label-input";
import { transformCustomerToContent } from "./utils";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  token: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  vat?: string;
  contact?: string;
  website?: string;
  tags?: { tag: { id: string; name: string } }[];
}

interface CustomerDetailsProps {
  customers: Customer[];
}

export function CustomerDetails({ customers }: CustomerDetailsProps) {
  const { control, setValue, watch } = useFormContext();
  const { setParams, selectedCustomerId } = useInvoiceParams();
  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const content = watch("customer_details");
  const id = watch("id");

  const handleLabelSave = (value: string) => {
    updateInvoiceTemplate.execute({ customer_label: value });
  };

  const handleOnChange = (content?: JSONContent | null) => {
    // Reset the selected customer id when the content is changed
    setParams({ selectedCustomerId: null });

    setValue("customer_details", content, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (!content) {
      setValue("customer_name", null, { shouldValidate: true });
      setValue("customer_id", null, { shouldValidate: true });
    }
  };

  useEffect(() => {
    const customer = customers.find((c) => c.id === selectedCustomerId);

    if (customer) {
      const customerContent = transformCustomerToContent(customer);

      // Remove the selected customer id from the url so we don't introduce a race condition
      setParams({ selectedCustomerId: null });

      setValue("customer_name", customer.name, { shouldValidate: true });
      setValue("customer_id", customer.id, { shouldValidate: true });
      setValue("customer_details", customerContent, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [selectedCustomerId, customers]);

  return (
    <div>
      <LabelInput
        name="template.customer_label"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {content ? (
        <Controller
          name="customer_details"
          control={control}
          render={({ field }) => (
            <Editor
              // NOTE: This is a workaround to get the new content to render
              key={id}
              initialContent={field.value}
              onChange={handleOnChange}
              className="min-h-[90px]"
            />
          )}
        />
      ) : (
        <SelectCustomer data={customers} />
      )}
    </div>
  );
}
