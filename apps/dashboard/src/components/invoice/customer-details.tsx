"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
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
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface CustomerDetailsProps {
  customers: Customer[];
}

export function CustomerDetails({ customers }: CustomerDetailsProps) {
  const { control, setValue, watch } = useFormContext();
  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const selectedCustomerId = watch("customer_id");
  const content = watch("customerDetails");

  const foundCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  useEffect(() => {
    if (foundCustomer) {
      const initialContent = transformCustomerToContent(foundCustomer);
      setValue("customerDetails", initialContent, { shouldValidate: true });
    }
  }, [foundCustomer, setValue]);

  const handleLabelSave = (value: string) => {
    updateInvoiceTemplate.execute({ customer_label: value });
  };

  return (
    <div>
      <LabelInput
        name="template.customer_label"
        className="mb-2 block"
        onSave={handleLabelSave}
      />
      {content ? (
        <Controller
          name="customerDetails"
          control={control}
          render={({ field }) => (
            <Editor
              key={selectedCustomerId}
              initialContent={field.value}
              onChange={field.onChange}
              className="h-[115px]"
            />
          )}
        />
      ) : (
        <SelectCustomer data={customers} />
      )}
    </div>
  );
}
