import { Text, View } from "@react-pdf/renderer";
import { calculateTotal } from "../../../utils/calculate";
import { formatCurrencyForPDF } from "../../../utils/pdf-format";

interface SummaryProps {
  amount?: number | null;
  tax?: number | null;
  taxRate?: number;
  vat?: number | null;
  vatRate?: number;
  currency?: string | null;
  totalLabel: string;
  taxLabel: string;
  vatLabel: string;
  locale: string;
  discount?: number | null;
  discountLabel: string;
  includeDiscount: boolean;
  includeVat: boolean;
  includeTax: boolean;
  includeLineItemTax?: boolean;
  includeDecimals: boolean;
  subtotalLabel: string;
  lineItems: { price?: number; quantity?: number; taxRate?: number }[];
}

export function Summary({
  amount,
  tax,
  taxRate,
  vat,
  vatRate,
  currency,
  totalLabel,
  taxLabel,
  vatLabel,
  locale,
  discount,
  discountLabel,
  includeDiscount,
  includeVat,
  includeTax,
  includeLineItemTax,
  includeDecimals,
  subtotalLabel,
  lineItems,
}: SummaryProps) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  // Calculate subtotal dynamically from line items (same as HTML template)
  const { subTotal: calculatedSubtotal, tax: calculatedTax } = calculateTotal({
    lineItems,
    taxRate: taxRate ?? 0,
    vatRate: vatRate ?? 0,
    discount: discount ?? 0,
    includeVat,
    includeTax,
    includeLineItemTax,
  });

  const displayTotal = amount ?? 0;
  const displaySubtotal = calculatedSubtotal;
  const displayVat = vat ?? 0;
  // Use calculated tax for line item tax mode, otherwise use the passed tax
  const displayTax = includeLineItemTax ? calculatedTax : (tax ?? 0);

  return (
    <View
      style={{
        marginTop: 60,
        marginBottom: 40,
        alignItems: "flex-end",
        marginLeft: "auto",
        width: 250,
      }}
    >
      <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
        <Text style={{ fontSize: 9, flex: 1 }}>{subtotalLabel}</Text>
        <Text style={{ fontSize: 9, textAlign: "right" }}>
          {currency &&
            formatCurrencyForPDF({
              amount: displaySubtotal,
              currency,
              locale,
              maximumFractionDigits,
            })}
        </Text>
      </View>

      {includeDiscount && discount != null && discount !== 0 && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>{discountLabel}</Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: discount,
                currency,
                locale,
                maximumFractionDigits,
              })}
          </Text>
        </View>
      )}

      {includeVat && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>
            {vatLabel} ({String(vatRate ?? 0)}%)
          </Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: displayVat,
                currency,
                locale,
                maximumFractionDigits: 2,
              })}
          </Text>
        </View>
      )}

      {includeTax && !includeLineItemTax && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>
            {taxLabel} ({String(taxRate ?? 0)}%)
          </Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: displayTax,
                currency,
                locale,
                maximumFractionDigits: 2,
              })}
          </Text>
        </View>
      )}

      {includeLineItemTax && displayTax > 0 && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>{taxLabel}</Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: displayTax,
                currency,
                locale,
                maximumFractionDigits: 2,
              })}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          marginTop: 5,
          borderTopWidth: 0.5,
          borderTopColor: "#000",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 5,
          width: "100%",
        }}
      >
        <Text style={{ fontSize: 9, marginRight: 10 }}>{totalLabel}</Text>
        <Text style={{ fontSize: 21 }}>
          {currency &&
            formatCurrencyForPDF({
              amount: displayTotal,
              currency,
              locale,
              maximumFractionDigits:
                includeTax || includeVat || includeLineItemTax
                  ? 2
                  : maximumFractionDigits,
            })}
        </Text>
      </View>
    </View>
  );
}
