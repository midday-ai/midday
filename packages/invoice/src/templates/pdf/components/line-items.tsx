import { formatAmount } from "@midday/utils/format";
import { Text, View } from "@react-pdf/renderer";
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
    <View style={{ marginTop: 20 }}>
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 0.5,
          borderBottomColor: "#000",
          paddingBottom: 5,
          marginBottom: 5,
        }}
      >
        <Text style={{ flex: 3, fontSize: 9, fontWeight: 500 }}>
          {descriptionLabel}
        </Text>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: 500 }}>
          {priceLabel}
        </Text>
        <Text style={{ flex: 0.5, fontSize: 9, fontWeight: 500 }}>
          {quantityLabel}
        </Text>
        <Text
          style={{
            flex: 1,
            fontSize: 9,
            fontWeight: 500,
            textAlign: "right",
          }}
        >
          {totalLabel}
        </Text>
      </View>
      {lineItems.map((item, index) => (
        <View
          key={`line-item-${index.toString()}`}
          style={{ flexDirection: "row", paddingVertical: 5 }}
        >
          <Text style={{ flex: 3, fontSize: 9 }}>{item.name}</Text>
          <Text style={{ flex: 1, fontSize: 9 }}>
            {formatAmount({ currency, amount: item.price })}
          </Text>
          <Text style={{ flex: 0.5, fontSize: 9 }}>{item.quantity}</Text>
          <Text style={{ flex: 1, fontSize: 9, textAlign: "right" }}>
            {formatAmount({ currency, amount: item.quantity * item.price })}
          </Text>
        </View>
      ))}
    </View>
  );
}
