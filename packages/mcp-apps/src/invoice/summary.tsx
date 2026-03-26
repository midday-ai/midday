import { calculateTotal } from "@midday/invoice/calculate";

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

  return (
    <div className="w-[320px] flex flex-col">
      <div className="flex justify-between items-center py-1">
        <span className="text-[11px] text-[#878787] font-mono">
          {subtotalLabel}
        </span>
        <span className="text-[11px] text-[#878787] text-right">
          {fmt(subTotal)}
        </span>
      </div>

      {includeDiscount && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {discountLabel}
          </span>
          <span className="text-[11px] text-[#878787] text-right">
            {fmt(discount ?? 0)}
          </span>
        </div>
      )}

      {includeVat && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {vatLabel} ({vatRate}%)
          </span>
          <span className="text-[11px] text-[#878787] text-right">
            {fmt(totalVAT, 2)}
          </span>
        </div>
      )}

      {includeTax && !includeLineItemTax && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {taxLabel} ({taxRate}%)
          </span>
          <span className="text-[11px] text-[#878787] text-right">
            {fmt(totalTax, 2)}
          </span>
        </div>
      )}

      {includeLineItemTax && totalTax > 0 && (
        <div className="flex justify-between items-center py-1">
          <span className="text-[11px] text-[#878787] font-mono">
            {taxLabel}
          </span>
          <span className="text-[11px] text-[#878787] text-right">
            {fmt(totalTax, 2)}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center py-4 mt-2 border-t border-border">
        <span className="text-[11px] text-[#878787] font-mono">
          {totalLabel}
        </span>
        <span className="text-xl text-right">
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
