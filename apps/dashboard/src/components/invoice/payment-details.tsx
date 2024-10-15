"use client";

import { updateInvoiceSettingsAction } from "@/actions/invoice/update-invoice-settings-action";
import { Editor } from "@/components/editor";
import { useAction } from "next-safe-action/hooks";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  const updateInvoiceSettings = useAction(updateInvoiceSettingsAction);

  return (
    <div>
      <LabelInput
        name="settings.payment_details_label"
        onSave={(value) => {
          updateInvoiceSettings.execute({
            payment_details_label: value,
          });
        }}
        className="mb-2 block"
      />
      <Editor className="h-[78px]" />
    </div>
  );
}
