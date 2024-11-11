import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { calculateTotals } from "@midday/invoice/calculate";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import { AmountInput } from "./amount-input";
import { LabelInput } from "./label-input";
import { TaxInput } from "./tax-input";

export function Summary() {
  const { control, setValue } = useFormContext<InvoiceFormValues>();

  const includeDecimals = useWatch({
    control,
    name: "template.include_decimals",
  });

  const maximumFractionDigits = includeDecimals ? 2 : 0;

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

  const includeDiscount = useWatch({
    control,
    name: "template.include_discount",
  });

  const lineItems = useWatch({
    control,
    name: "line_items",
  });

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);
  const { totalAmount, totalVAT } = calculateTotals(lineItems);

  const discount = useWatch({
    control,
    name: "discount",
  });

  const discountAmount = includeDiscount ? discount || 0 : 0;
  const amountAfterDiscount = totalAmount - discountAmount;
  const totalTax = includeTax
    ? (amountAfterDiscount * (taxRate || 0)) / 100
    : 0;

  const total = amountAfterDiscount + totalVAT + totalTax;

  const updateFormValues = useCallback(() => {
    if (total >= 0) {
      setValue("amount", total, { shouldValidate: true });
    }

    if (totalVAT) {
      setValue("vat", totalVAT, { shouldValidate: true });
    }

    if (totalTax) {
      setValue("tax", totalTax, { shouldValidate: true });
    }
  }, [total, totalVAT, totalTax]);

  useEffect(() => {
    updateFormValues();
  }, [updateFormValues]);

  useEffect(() => {
    if (!includeVAT) {
      lineItems.forEach((_, index) => {
        setValue(`line_items.${index}.vat`, 0, { shouldValidate: true });
      });
    }
  }, [includeVAT]);

  useEffect(() => {
    if (!includeTax) {
      setValue("template.tax_rate", 0, { shouldValidate: true });
    }
  }, [includeTax]);

  useEffect(() => {
    if (!includeDiscount) {
      setValue("discount", 0, { shouldValidate: true });
    }
  }, [includeDiscount]);

  return (
    <div className="w-[320px] flex flex-col">
      {includeDiscount && (
        <div className="flex justify-between items-center py-1">
          <LabelInput
            name="template.discount_label"
            onSave={(value) => {
              updateInvoiceTemplate.execute({
                discount_label: value,
              });
            }}
          />

          <AmountInput
            placeholder="0"
            allowNegative={false}
            name="discount"
            className="text-right font-mono text-[11px] text-[#878787] border-none"
          />
        </div>
      )}

      {includeVAT && (
        <div className="flex justify-between items-center py-1">
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
              maximumFractionDigits={maximumFractionDigits}
              currency={currency}
            />
          </span>
        </div>
      )}

      {includeTax && (
        <div className="flex justify-between items-center py-1">
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
              maximumFractionDigits={maximumFractionDigits}
              currency={currency}
            />
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4 mt-2 border-t border-border">
        <LabelInput
          name="template.total_summary_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              total_summary_label: value,
            });
          }}
        />
        <span className="text-right font-mono text-[21px]">
          <AnimatedNumber
            value={total}
            currency={currency}
            maximumFractionDigits={maximumFractionDigits}
          />
        </span>
      </div>
    </div>
  );
}
