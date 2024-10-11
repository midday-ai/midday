import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import type { InvoiceFormValues } from "./schema";

export function Summary() {
  const { control } = useFormContext<InvoiceFormValues>();
  const lineItems = useWatch({
    control,
    name: "lineItems",
  });

  const { totalAmount, totalVAT } = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const itemVAT = (itemTotal * (item.vat || 0)) / 100;
        return {
          totalAmount: acc.totalAmount + itemTotal,
          totalVAT: acc.totalVAT + itemVAT,
        };
      },
      { totalAmount: 0, totalVAT: 0 },
    );
  }, [lineItems]);

  const total = totalAmount + totalVAT;

  return (
    <div className="w-[240px] flex flex-col space-y-4 divide-y divide-border">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] text-[#878787]">VAT</span>
        <span className="text-right font-mono text-[11px] text-[#878787]">
          <FormatAmount
            amount={totalVAT}
            minimumFractionDigits={0}
            maximumFractionDigits={2}
            currency="USD"
          />
        </span>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="font-mono text-[11px] text-[#878787]">Total</span>
        <span className="text-right font-mono text-[21px]">
          <AnimatedNumber
            value={total}
            currency="USD"
            minimumFractionDigits={0}
            maximumFractionDigits={2}
          />
        </span>
      </div>
    </div>
  );
}
