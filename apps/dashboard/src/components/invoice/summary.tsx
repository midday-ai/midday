import type { InvoiceFormValues } from "@/actions/invoice/schema";
import { updateInvoiceTemplateAction } from "@/actions/invoice/update-invoice-template-action";
import { calculateTotal } from "@midday/invoice/calculate";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import { AmountInput } from "./amount-input";
import { LabelInput } from "./label-input";
import { TaxInput } from "./tax-input";
import { VATInput } from "./vat-input";

export function Summary() {
  const { control, setValue } = useFormContext<InvoiceFormValues>();

  const updateInvoiceTemplate = useAction(updateInvoiceTemplateAction);

  const includeDecimals = useWatch({
    control,
    name: "template.include_decimals",
  });

  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const currency = useWatch({
    control,
    name: "template.currency",
  });

  const locale = useWatch({
    control,
    name: "template.locale",
  });

  const includeTax = useWatch({
    control,
    name: "template.include_tax",
  });

  const taxRate = useWatch({
    control,
    name: "template.tax_rate",
  });

  const vatRate = useWatch({
    control,
    name: "template.vat_rate",
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

  const discount = useWatch({
    control,
    name: "discount",
  });

  const {
    subTotal,
    total,
    vat: totalVAT,
    tax: totalTax,
  } = calculateTotal({
    lineItems,
    taxRate,
    vatRate,
    includeTax,
    discount: discount ?? 0,
  });

  const updateFormValues = useCallback(() => {
    setValue("amount", total, { shouldValidate: true });
    setValue("vat", totalVAT, { shouldValidate: true });
    setValue("tax", totalTax, { shouldValidate: true });
    setValue("subtotal", subTotal, { shouldValidate: true });
  }, [total, totalVAT, totalTax, subTotal]);

  useEffect(() => {
    updateFormValues();
  }, [updateFormValues]);

  useEffect(() => {
    if (!includeTax) {
      setValue("template.tax_rate", 0, { shouldValidate: true });
    }
  }, [includeTax]);

  useEffect(() => {
    if (!includeVAT) {
      setValue("template.vat_rate", 0, { shouldValidate: true });
    }
  }, [includeVAT]);

  useEffect(() => {
    if (!includeDiscount) {
      setValue("discount", 0, { shouldValidate: true });
    }
  }, [includeDiscount]);

  return (
    <div className="w-[320px] flex flex-col">
      <div className="flex justify-between items-center py-1">
        <LabelInput
          className="flex-shrink-0 min-w-6"
          name="template.subtotal_label"
          onSave={(value) => {
            updateInvoiceTemplate.execute({
              subtotal_label: value,
            });
          }}
        />
        <span className="text-right font-mono text-[11px] text-[#878787]">
          <FormatAmount
            amount={subTotal}
            maximumFractionDigits={maximumFractionDigits}
            currency={currency}
            locale={locale}
          />
        </span>
      </div>

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
          <div className="flex items-center gap-1">
            <LabelInput
              className="flex-shrink-0 min-w-5"
              name="template.vat_label"
              onSave={(value) => {
                updateInvoiceTemplate.execute({
                  vat_label: value,
                });
              }}
            />

            <VATInput />
          </div>

          <span className="text-right font-mono text-[11px] text-[#878787]">
            <FormatAmount
              amount={totalVAT}
              maximumFractionDigits={maximumFractionDigits}
              currency={currency}
              locale={locale}
            />
          </span>
        </div>
      )}

      {includeTax && (
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-1">
            <LabelInput
              className="flex-shrink-0 min-w-5"
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
        <span className="text-right font-mono font-medium text-[21px]">
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
