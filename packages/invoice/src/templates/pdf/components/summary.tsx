import { Text, View } from "@react-pdf/renderer";
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
  includeDecimals: boolean;
  subtotalLabel: string;
  subtotal: number;
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
  includeDecimals,
  subtotalLabel,
  subtotal,
}: SummaryProps) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const displayTotal = amount ?? 0;
  const displaySubtotal = subtotal ?? 0;
  const displayVat = vat ?? 0;
  const displayTax = tax ?? 0;

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

      {includeDiscount && discount && (
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
            {vatLabel} ({vatRate}%)
          </Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: displayVat,
                currency,
                locale,
                maximumFractionDigits,
              })}
          </Text>
        </View>
      )}

      {includeTax && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>
            {taxLabel} ({taxRate}%)
          </Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: displayTax,
                currency,
                locale,
                maximumFractionDigits,
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
              maximumFractionDigits,
            })}
        </Text>
      </View>
    </View>
  );
}
