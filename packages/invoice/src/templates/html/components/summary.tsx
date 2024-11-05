import { calculateTotals } from "../../../utils/calculate";
import type { LineItem } from "../../types";

type Props = {
  includeVAT: boolean;
  includeTax: boolean;
  includeDiscount: boolean;
  discount?: number;
  discountLabel: string;
  taxRate: number;
  locale: string;
  currency: string;
  vatLabel: string;
  taxLabel: string;
  totalLabel: string;
  lineItems: LineItem[];
  includeDecimals?: boolean;
};

export function Summary({
  includeVAT,
  includeTax,
  includeDiscount,
  discountLabel,
  locale,
  discount,
  taxRate,
  currency,
  vatLabel,
  taxLabel,
  totalLabel,
  lineItems,
  includeDecimals,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const { totalAmount, totalVAT } = calculateTotals(lineItems);
  const discountAmount = includeDiscount ? discount || 0 : 0;
  const amountAfterDiscount = totalAmount - discountAmount;
  const totalTax = includeTax
    ? (amountAfterDiscount * (taxRate || 0)) / 100
    : 0;

  const total = amountAfterDiscount + totalVAT + totalTax;

  return (
    <div className="w-[320px] flex flex-col">
      {includeDiscount && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {discountLabel}
          </span>
          <span className="text-right font-mono text-[11px] text-[#878787]">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: currency,
              maximumFractionDigits,
            }).format(discount)}
          </span>
        </div>
      )}

      {includeVAT && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {vatLabel}
          </span>
          <span className="text-right font-mono text-[11px] text-[#878787]">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: currency,
              maximumFractionDigits,
            }).format(totalVAT)}
          </span>
        </div>
      )}

      {includeTax && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {taxLabel} ({taxRate}%)
          </span>
          <span className="text-right font-mono text-[11px] text-[#878787]">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: currency,
              maximumFractionDigits,
            }).format(totalTax)}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4 mt-2 border-t border-border">
        <span className="text-[11px] text-[#878787] font-mono">
          {totalLabel}
        </span>
        <span className="text-right font-mono text-[21px]">
          {new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            maximumFractionDigits,
          }).format(total)}
        </span>
      </div>
    </div>
  );
}
