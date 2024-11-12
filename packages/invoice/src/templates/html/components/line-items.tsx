import { formatAmount } from "@midday/utils/format";
import { calculateLineItemTotal } from "../../../utils/calculate";
import type { LineItem } from "../../types";

type Props = {
  lineItems: LineItem[];
  currency: string;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  vatLabel?: string;
  includeVAT?: boolean;
  includeDecimals?: boolean;
  locale: string;
};

export function LineItems({
  lineItems,
  currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
  vatLabel,
  includeVAT = false,
  includeDecimals = false,
  locale,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  return (
    <div className="mt-5 font-mono">
      <div
        className={`grid ${includeVAT ? "grid-cols-[1.5fr_15%_15%_6%_15%]" : "grid-cols-[1.5fr_15%_15%_15%]"} gap-4 items-end relative group mb-2 w-full pb-1 border-b border-border`}
      >
        <div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
        <div className="text-[11px] text-[#878787]">{quantityLabel}</div>
        <div className="text-[11px] text-[#878787]">{priceLabel}</div>
        {includeVAT && (
          <div className="text-[11px] text-[#878787]">{vatLabel}</div>
        )}
        <div className="text-[11px] text-[#878787] text-right">
          {totalLabel}
        </div>
      </div>

      {lineItems.map((item, index) => (
        <div
          key={`line-item-${index.toString()}`}
          className={`grid ${includeVAT ? "grid-cols-[1.5fr_15%_15%_6%_15%]" : "grid-cols-[1.5fr_15%_15%_15%]"} gap-4 items-end relative group mb-1 w-full py-1`}
        >
          <div className="text-[11px]">{item.name}</div>
          <div className="text-[11px]">{item.quantity}</div>
          <div className="text-[11px]">
            {formatAmount({
              currency,
              amount: item.price,
              maximumFractionDigits,
              locale,
            })}
          </div>
          {includeVAT && <div className="text-[11px]">{item.vat}%</div>}
          <div className="text-[11px] text-right">
            {formatAmount({
              maximumFractionDigits,
              currency,
              amount: calculateLineItemTotal({
                price: item.price,
                quantity: item.quantity,
                vat: item.vat,
                includeVAT,
              }),
              locale,
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
