import { calculateLineItemTotal } from "@midday/invoice/calculate";
import { formatAmount } from "@midday/utils/format";
import { EditorContent } from "./editor-content";

function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function Description({ content }: { content: string }) {
  const value = isValidJSON(content) ? JSON.parse(content) : null;
  if (!value) {
    return <div className="leading-[16px] text-[11px]">{content}</div>;
  }
  return <EditorContent content={value} />;
}

type LineItem = {
  name: string;
  quantity?: number;
  price?: number;
  taxRate?: number;
  unit?: string;
};

type Props = {
  lineItems: LineItem[];
  currency: string | null;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  includeDecimals?: boolean;
  locale: string;
  includeUnits?: boolean;
  includeLineItemTax?: boolean;
  lineItemTaxLabel?: string;
};

export function LineItems({
  lineItems,
  currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
  includeDecimals = false,
  includeUnits = false,
  includeLineItemTax = false,
  lineItemTaxLabel = "Tax",
  locale,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const columns = includeLineItemTax
    ? "1.5fr 12% 12% 12% 15%"
    : "1.5fr 15% 15% 15%";

  const fmt = (amount: number) =>
    currency
      ? formatAmount({ currency, amount, maximumFractionDigits, locale })
      : String(amount);

  return (
    <div className="mt-5 font-mono">
      <div
        className="grid gap-4 items-end mb-2 pb-1 border-b border-border"
        style={{ gridTemplateColumns: columns }}
      >
        <div className="text-[11px] text-[#878787]">{descriptionLabel}</div>
        <div className="text-[11px] text-[#878787]">{quantityLabel}</div>
        <div className="text-[11px] text-[#878787]">{priceLabel}</div>
        {includeLineItemTax && (
          <div className="text-[11px] text-[#878787]">{lineItemTaxLabel}</div>
        )}
        <div className="text-[11px] text-[#878787] text-right">
          {totalLabel}
        </div>
      </div>

      {lineItems.map((item, index) => {
        const itemTotal = calculateLineItemTotal({
          price: item.price,
          quantity: item.quantity,
        });

        const priceDisplay =
          currency && includeUnits && item.unit
            ? `${fmt(item.price ?? 0)}/${item.unit}`
            : fmt(item.price ?? 0);

        return (
          <div
            key={`li-${item.name}-${index.toString()}`}
            className="grid gap-4 items-start mb-1 py-1"
            style={{ gridTemplateColumns: columns }}
          >
            <div>
              <Description content={item.name} />
            </div>
            <div className="text-[11px]">{item.quantity ?? 0}</div>
            <div className="text-[11px]">{priceDisplay}</div>
            {includeLineItemTax && (
              <div className="text-[11px]">
                {item.taxRate != null ? `${item.taxRate}%` : "0%"}
              </div>
            )}
            <div className="text-[11px] text-right">{fmt(itemTotal)}</div>
          </div>
        );
      })}
    </div>
  );
}
