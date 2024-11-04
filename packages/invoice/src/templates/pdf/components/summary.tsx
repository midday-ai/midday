import { formatAmount } from "@midday/utils/format";
import { Text, View } from "@react-pdf/renderer";

interface SummaryProps {
  amount: number;
  tax?: number;
  taxRate?: number;
  vat?: number;
  currency: string;
  totalLabel: string;
  taxLabel: string;
  vatLabel: string;
  locale: string;
}

export function Summary({
  amount,
  tax,
  taxRate,
  vat,
  currency,
  totalLabel,
  taxLabel,
  vatLabel,
  locale,
}: SummaryProps) {
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
      {tax && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>
            {taxLabel} ({taxRate}%)
          </Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {formatAmount({ currency, amount: tax, locale })}
          </Text>
        </View>
      )}

      {vat && (
        <View style={{ flexDirection: "row", marginBottom: 5, width: "100%" }}>
          <Text style={{ fontSize: 9, flex: 1 }}>{vatLabel}</Text>
          <Text style={{ fontSize: 9, textAlign: "right" }}>
            {formatAmount({ currency, amount: vat, locale })}
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
          {formatAmount({ currency, amount, locale })}
        </Text>
      </View>
    </View>
  );
}
