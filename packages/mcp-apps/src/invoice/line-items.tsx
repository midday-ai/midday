import { formatAmount } from "../utils/format-amount";
import { calculateLineItemTotal } from "./calculate";
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
    return <div style={{ lineHeight: "16px", fontSize: 11 }}>{content}</div>;
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

const HEADER_STYLE: React.CSSProperties = {
  fontSize: 11,
  color: "#878787",
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
    <div style={{ marginTop: 20, fontFamily: "var(--font-mono)" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: columns,
          gap: 16,
          alignItems: "end",
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: "1px solid var(--border-color, #e5e5e5)",
        }}
      >
        <div style={HEADER_STYLE}>{descriptionLabel}</div>
        <div style={HEADER_STYLE}>{quantityLabel}</div>
        <div style={HEADER_STYLE}>{priceLabel}</div>
        {includeLineItemTax && (
          <div style={HEADER_STYLE}>{lineItemTaxLabel}</div>
        )}
        <div style={{ ...HEADER_STYLE, textAlign: "right" }}>{totalLabel}</div>
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
            style={{
              display: "grid",
              gridTemplateColumns: columns,
              gap: 16,
              alignItems: "start",
              marginBottom: 4,
              padding: "4px 0",
            }}
          >
            <div>
              <Description content={item.name} />
            </div>
            <div style={{ fontSize: 11 }}>{item.quantity ?? 0}</div>
            <div style={{ fontSize: 11 }}>{priceDisplay}</div>
            {includeLineItemTax && (
              <div style={{ fontSize: 11 }}>
                {item.taxRate != null ? `${item.taxRate}%` : "0%"}
              </div>
            )}
            <div style={{ fontSize: 11, textAlign: "right" }}>
              {fmt(itemTotal)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
