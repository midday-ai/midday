import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { useAction } from "next-safe-action/hooks";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function InvoiceNo() {
  const { watch } = useFormContext();
  const invoiceNumber = watch("invoiceNumber");

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  return (
    <div className="flex space-x-1 items-center">
      <div className="flex items-center">
        <LabelInput
          name="template.invoice_no_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              invoice_no_label: value,
            });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>
      <span className="text-primary text-[11px] font-mono whitespace-nowrap">
        {invoiceNumber}
      </span>
    </div>
  );
}
