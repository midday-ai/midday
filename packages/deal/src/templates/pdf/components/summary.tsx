import { Text, View } from "@react-pdf/renderer";
import { calculateTotal } from "../../../utils/calculate";
import { formatCurrencyForPDF } from "../../../utils/pdf-format";

interface SummaryProps {
  amount?: number | null;
  currency?: string | null;
  totalLabel: string;
  locale: string;
  discount?: number | null;
  discountLabel: string;
  includeDiscount: boolean;
  includeDecimals: boolean;
  subtotalLabel: string;
  lineItems: { price?: number; quantity?: number }[];
}

export function Summary({
  amount,
  currency,
  totalLabel,
  locale,
  discount,
  discountLabel,
  includeDiscount,
  includeDecimals,
  subtotalLabel,
  lineItems,
}: SummaryProps) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

  const { subTotal: calculatedSubtotal } = calculateTotal({
    lineItems,
    discount: discount ?? 0,
  });

  const displayTotal = amount ?? 0;
  const displaySubtotal = calculatedSubtotal;

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
