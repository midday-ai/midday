import { calculateTotals } from "../../../utils/calculate";
import type { LineItem } from "../../types";

type Props = {
  includeVAT: boolean;
  includeTax: boolean;
  taxRate: number;
  currency: string;
  vatLabel: string;
  taxLabel: string;
  totalLabel: string;
  lineItems: LineItem[];
};

export function Summary({
  includeVAT,
  includeTax,
  taxRate,
  currency,
  vatLabel,
  taxLabel,
  totalLabel,
  lineItems,
}: Props) {
  const { totalAmount, totalVAT } = calculateTotals(lineItems);

  const totalTax = includeTax ? (totalAmount * (taxRate || 0)) / 100 : 0;

  const total = totalAmount + totalVAT + totalTax;

  return (
    <div className="w-[320px] flex flex-col divide-y divide-border">
      {includeVAT && (
        <div className="flex justify-between items-center py-3">
          <span className="text-[11px] text-[#878787] font-mono">
            {vatLabel}
          </span>
          <span className="text-right font-mono text-[11px] text-[#878787]">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(totalVAT)}
          </span>
        </div>
      )}

      {includeTax && (
        <div className="flex justify-between items-center py-3">
          <span className="text-[11px] text-[#878787] font-mono">
            {taxLabel} ({taxRate}%)
          </span>
          <span className="text-right font-mono text-[11px] text-[#878787]">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            }).format(totalTax)}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4">
        <span className="text-[11px] text-[#878787] font-mono">
          {totalLabel}
        </span>
        <span className="text-right font-mono text-[21px]">
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(total)}
        </span>
      </div>
    </div>
  );
}
