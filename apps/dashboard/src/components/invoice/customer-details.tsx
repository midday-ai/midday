"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { SelectCustomer } from "../select-customer";
import { LabelInput } from "./label-input";
import { transformCustomerToContent } from "./utils";

export type Customer = {
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
};

export function CustomerDetails({ customers }: { customers: Customer[] }) {
  const { control, setValue, watch } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const selectedCustomerId = watch("customer_id");

  const foundCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  const initialContent = transformCustomerToContent(foundCustomer);

  useEffect(() => {
    if (foundCustomer) {
      setValue("customerDetails", initialContent, { shouldValidate: true });
    }
  }, [foundCustomer]);

  return (
    <div>
      <LabelInput
        name="template.customer_label"
        className="mb-2 block"
        onSave={(value) => {
          updateInvoiceTemplate.execute({
            customer_label: value,
          });
        }}
      />
      {initialContent ? (
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
