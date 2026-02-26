import type { LineItem } from "../../../types";
import { calculateTotal } from "../../../utils/calculate";

type Props = {
  includeDiscount: boolean;
  discount?: number | null;
  discountLabel: string;
  locale: string;
  currency: string | null;
  totalLabel: string;
  lineItems: LineItem[];
  includeDecimals?: boolean;
  subtotalLabel: string;
};

export function Summary({
  includeDiscount,
  discountLabel,
  locale,
  discount,
  currency,
  totalLabel,
  lineItems,
  includeDecimals,
  subtotalLabel,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const { subTotal, total } = calculateTotal({
    lineItems,
    discount: discount ?? 0,
  });

  return (
    <div className="w-[320px] flex flex-col">
      <div className="flex justify-between items-center py-1">
        <span className="text-[11px] text-[#878787] font-mono">
          {subtotalLabel}
        </span>
        <span className="text-right text-[11px] text-[#878787]">
          {currency &&
            new Intl.NumberFormat(locale, {
              style: "currency",
              currency: currency,
              maximumFractionDigits,
            }).format(subTotal)}
        </span>
      </div>

      {includeDiscount && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {discountLabel}
          </span>
          <span className="text-right text-[11px] text-[#878787]">
            {currency &&
              new Intl.NumberFormat(locale, {
                style: "currency",
                currency: currency,
                maximumFractionDigits,
              }).format(discount ?? 0)}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4 mt-2 border-t border-border">
        <span className="text-[11px] text-[#878787] font-mono">
          {totalLabel}
        </span>
        <span className="text-right text-[21px]">
          {currency &&
            new Intl.NumberFormat(locale, {
              style: "currency",
              currency: currency,
              maximumFractionDigits,
            }).format(total)}
        </span>
      </div>
    </div>
  );
}
