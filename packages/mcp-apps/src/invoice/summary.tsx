import { calculateTotal } from "./calculate";

type LineItem = {
  price?: number;
  quantity?: number;
  taxRate?: number;
};

type Props = {
  includeVat: boolean;
  includeTax: boolean;
  includeDiscount: boolean;
  includeLineItemTax?: boolean;
  discount?: number | null;
  discountLabel: string;
  taxRate: number;
  vatRate: number;
  locale: string;
  currency: string | null;
  vatLabel: string;
  taxLabel: string;
  totalLabel: string;
  lineItems: LineItem[];
  includeDecimals?: boolean;
  subtotalLabel: string;
};

export function Summary({
  includeVat,
  includeTax,
  includeDiscount,
  includeLineItemTax,
  discountLabel,
  locale,
  discount,
  taxRate,
  vatRate,
  currency,
  vatLabel,
  taxLabel,
  totalLabel,
  lineItems,
  includeDecimals,
  subtotalLabel,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const {
    subTotal,
    total,
    vat: totalVAT,
    tax: totalTax,
  } = calculateTotal({
    lineItems,
    taxRate,
    vatRate,
    discount: discount ?? 0,
    includeVat,
    includeTax,
    includeLineItemTax,
  });

  const fmt = (amount: number, fractionDigits?: number) =>
    currency
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: fractionDigits ?? maximumFractionDigits,
        }).format(amount)
      : String(amount);

  const ROW: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
  };

  const LABEL: React.CSSProperties = {
    fontSize: 11,
    color: "#878787",
    fontFamily: "var(--font-mono)",
  };

  const VALUE: React.CSSProperties = {
    fontSize: 11,
    color: "#878787",
    textAlign: "right",
  };

  return (
    <div style={{ width: 320, display: "flex", flexDirection: "column" }}>
      <div style={ROW}>
        <span style={LABEL}>{subtotalLabel}</span>
        <span style={VALUE}>{fmt(subTotal)}</span>
      </div>

      {includeDiscount && (
        <div style={ROW}>
          <span style={LABEL}>{discountLabel}</span>
          <span style={VALUE}>{fmt(discount ?? 0)}</span>
        </div>
      )}

      {includeVat && (
        <div style={ROW}>
          <span style={LABEL}>
            {vatLabel} ({vatRate}%)
          </span>
          <span style={VALUE}>{fmt(totalVAT, 2)}</span>
        </div>
      )}

      {includeTax && !includeLineItemTax && (
        <div style={ROW}>
          <span style={LABEL}>
            {taxLabel} ({taxRate}%)
          </span>
          <span style={VALUE}>{fmt(totalTax, 2)}</span>
        </div>
      )}

      {includeLineItemTax && totalTax > 0 && (
        <div style={ROW}>
          <span style={LABEL}>{taxLabel}</span>
          <span style={VALUE}>{fmt(totalTax, 2)}</span>
        </div>
      )}

      <div
        style={{
          ...ROW,
          padding: "16px 0",
          marginTop: 8,
          borderTop: "1px solid var(--border-color, #e5e5e5)",
        }}
      >
        <span style={LABEL}>{totalLabel}</span>
        <span style={{ fontSize: 21, textAlign: "right" }}>
          {fmt(
            total,
            includeTax || includeVat || includeLineItemTax
              ? 2
              : maximumFractionDigits,
          )}
        </span>
      </div>
    </div>
  );
}
