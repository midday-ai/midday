import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { calculateTotals } from "@midday/invoice/calculate";
import { useAction } from "next-safe-action/hooks";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import { LabelInput } from "./label-input";
import { TaxInput } from "./tax-input";

export function Summary() {
  const { control, setValue } = useFormContext<InvoiceFormValues>();

  const currency = useWatch({
    control,
    name: "template.currency",
  });

  const includeTax = useWatch({
    control,
    name: "template.include_tax",
  });

  const taxRate = useWatch({
    control,
    name: "template.tax_rate",
  });

  const includeVAT = useWatch({
    control,
    name: "template.include_vat",
  });

  const lineItems = useWatch({
    control,
    name: "line_items",
  });

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const { totalAmount, totalVAT } = calculateTotals(lineItems);

  const totalTax = includeTax ? (totalAmount * (taxRate || 0)) / 100 : 0;

  const total = totalAmount + totalVAT + totalTax;

  useMemo(() => {
    if (total) {
      setValue("amount", total, { shouldValidate: true });
    }

    if (totalVAT) {
      setValue("vat", totalVAT, { shouldValidate: true });
    }

    if (totalTax) {
      setValue("tax", totalTax, { shouldValidate: true });
    }
  }, [total, totalVAT, totalTax, setValue]);

  return (
    <div className="w-[320px] flex flex-col divide-y divide-border">
      {includeVAT && (
        <div className="flex justify-between items-center py-3">
          <LabelInput
            name="template.vat_label"
            onSave={(value) => {
              updateInvoiceTemplate.execute({
                vat_label: value,
              });
            }}
          />

          <span className="text-right font-mono text-[11px] text-[#878787]">
            <FormatAmount
              amount={totalVAT}
              minimumFractionDigits={0}
              maximumFractionDigits={2}
              currency={currency}
            />
          </span>
        </div>
      )}

      {includeTax && (
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-1">
            <LabelInput
              className="flex-shrink-0"
              name="template.tax_label"
              onSave={(value) => {
                updateInvoiceTemplate.execute({
                  tax_label: value,
                });
              }}
            />

            <TaxInput />
          </div>

          <span className="text-right font-mono text-[11px] text-[#878787]">
            <FormatAmount
              amount={totalTax}
              minimumFractionDigits={0}
              maximumFractionDigits={2}
              currency={currency}
            />
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4">
        <LabelInput
          name="template.total_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              total_label: value,
            });
          }}
        />
        <span className="text-right font-mono text-[21px]">
          <AnimatedNumber value={total} currency={currency} />
        </span>
      </div>
    </div>
  );
}
