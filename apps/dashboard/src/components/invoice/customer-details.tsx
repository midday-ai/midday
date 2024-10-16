"use client";

import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { useFormContext } from "react-hook-form";
import { SelectCustomer } from "../select-customer";
import { LabelInput } from "./label-input";

const customers = [
  {
    id: "1",
    name: "Lost Island AB",
    email: "info@lostisland.se",
    phone: "+46 8 505 505 50",
    address: "Lost Island AB, 12345, Stockholm, Sweden",
  },
  {
    id: "2",
    name: "Viktor Hofte AB",
    email: "info@viktorhofte.se",
    phone: "+46 8 505 505 50",
    address: "Viktor Hofte AB, 12345, Stockholm, Sweden",
  },
];

export function CustomerDetails() {
  const { control } = useFormContext();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

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

      <SelectCustomer data={customers} />

      {/* <Controller
        name="customerDetails"
        control={control}
        render={({ field }) => (
          <Editor
            initialContent={field.value}
            onChange={field.onChange}
            className="h-[115px]"
          />
        )}
      /> */}
    </div>
  );
}
