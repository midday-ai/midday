import { useTRPC } from "@/trpc/client";
import { calculateTotal } from "@midday/invoice/calculate";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import { AmountInput } from "./amount-input";
import { LabelInput } from "./label-input";
import { TaxInput } from "./tax-input";
import { VATInput } from "./vat-input";

export function Summary() {
  const { control, setValue } = useFormContext();

  const trpc = useTRPC();
  const updateTemplateMutation = useMutation(
    trpc.invoiceTemplate.upsert.mutationOptions(),
  );

  const includeDecimals = useWatch({
    control,
    name: "template.includeDecimals",
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
    name: "template.includeTax",
  });

  const taxRate = useWatch({
    control,
    name: "template.taxRate",
  });

  const vatRate = useWatch({
    control,
    name: "template.vatRate",
  });

  const includeVAT = useWatch({
    control,
    name: "template.includeVAT",
  });

  const includeDiscount = useWatch({
    control,
    name: "template.includeDiscount",
  });

  const lineItems = useWatch({
    control,
    name: "lineItems",
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
    setValue("discount", discount ?? 0, { shouldValidate: true });
  }, [total, totalVAT, totalTax, subTotal, discount]);

  useEffect(() => {
    updateFormValues();
  }, [updateFormValues]);

  useEffect(() => {
    if (!includeTax) {
      setValue("template.taxRate", 0, { shouldValidate: true });
    }
  }, [includeTax]);

  useEffect(() => {
    if (!includeVAT) {
      setValue("template.vatRate", 0, { shouldValidate: true });
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
          name="template.subtotalLabel"
          onSave={(value) => {
            updateTemplateMutation.mutate({ subtotalLabel: value });
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
            name="template.discountLabel"
            onSave={(value) => {
              updateTemplateMutation.mutate({ discountLabel: value });
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
              name="template.vatLabel"
              onSave={(value) => {
                updateTemplateMutation.mutate({ vatLabel: value });
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
              name="template.taxLabel"
              onSave={(value) => {
                updateTemplateMutation.mutate({ taxLabel: value });
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
          name="template.totalSummaryLabel"
          onSave={(value) => {
            updateTemplateMutation.mutate({ totalSummaryLabel: value });
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
