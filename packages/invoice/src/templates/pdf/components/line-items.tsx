import { Text, View } from "@react-pdf/renderer";
import type { LineItem } from "../../../types";
import { calculateLineItemTotal } from "../../../utils/calculate";
import { formatCurrencyForPDF } from "../../../utils/pdf-format";
import { Description } from "./description";

type Props = {
  lineItems: LineItem[];
  currency: string | null;
  descriptionLabel: string;
  quantityLabel: string;
  priceLabel: string;
  totalLabel: string;
  locale: string;
  includeDecimals?: boolean;
  includeUnits?: boolean;
};

export function LineItems({
  lineItems,
  currency,
  descriptionLabel,
  quantityLabel,
  priceLabel,
  totalLabel,
  locale,
  includeDecimals,
  includeUnits,
}: Props) {
  const maximumFractionDigits = includeDecimals ? 2 : 0;

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
          {quantityLabel}
        </Text>
        <Text style={{ flex: 1, fontSize: 9, fontWeight: 500 }}>
          {priceLabel}
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
          style={{
            flexDirection: "row",
            paddingVertical: 5,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 3 }}>
            <Description content={item.name} />
          </View>

          <Text style={{ flex: 1, fontSize: 9 }}>{item.quantity ?? 0}</Text>

          <Text style={{ flex: 1, fontSize: 9 }}>
            {currency &&
              formatCurrencyForPDF({
                amount: item.price ?? 0,
                currency,
                locale,
                maximumFractionDigits,
              })}
            {includeUnits && item.unit ? ` / ${item.unit}` : null}
          </Text>

          <Text style={{ flex: 1, fontSize: 9, textAlign: "right" }}>
            {currency &&
              formatCurrencyForPDF({
                amount: calculateLineItemTotal({
                  price: item.price,
                  quantity: item.quantity,
                }),
                currency,
                locale,
                maximumFractionDigits,
              })}
          </Text>
        </View>
      ))}
    </View>
  );
}
