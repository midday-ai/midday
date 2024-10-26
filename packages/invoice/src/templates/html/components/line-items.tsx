import { formatAmount } from "../../../utils/format";
import type { LineItem } from "../../types";
type Props = {
  lineItems: LineItem[];
  currency: string;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
};

export function LineItems({
  lineItems,
  currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
}: Props) {
  return (
    <div className="mt-5">
      <div className="flex border-b border-black pb-1 mb-1">
        <div className="flex-3 text-xs font-medium">{descriptionLabel}</div>
        <div className="flex-1 text-xs font-medium">{priceLabel}</div>
        <div className="flex-[0.5] text-xs font-medium">{quantityLabel}</div>
        <div className="flex-1 text-xs font-medium text-right">
          {totalLabel}
        </div>
      </div>
      {lineItems.map((item, index) => (
        <div key={`line-item-${index.toString()}`} className="flex py-1">
          <div className="flex-3 text-xs">{item.name}</div>
          <div className="flex-1 text-xs">
            {formatAmount({ currency, amount: item.price })}
          </div>
          <div className="flex-[0.5] text-xs">{item.quantity}</div>
          <div className="flex-1 text-xs text-right">
            {formatAmount({ currency, amount: item.quantity * item.price })}
          </div>
        </div>
      ))}
    </div>
  );
}
