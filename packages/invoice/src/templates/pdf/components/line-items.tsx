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
  locale,
  includeDecimals,
  includeUnits,
  includeLineItemTax = false,
  lineItemTaxLabel = "Tax",
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
        {includeLineItemTax && (
          <Text style={{ flex: 1, fontSize: 9, fontWeight: 500 }}>
            {lineItemTaxLabel}
          </Text>
        )}
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
          wrap={false}
          style={{
            flexDirection: "row",
            paddingVertical: 5,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flex: 3, paddingRight: 20 }}>
            <Description content={item.name} />
          </View>

          <Text style={{ flex: 1, fontSize: 9 }}>
            {String(item.quantity ?? 0)}
          </Text>

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

          {includeLineItemTax && (
            <Text style={{ flex: 1, fontSize: 9 }}>
              {item.taxRate != null ? `${item.taxRate}%` : "0%"}
            </Text>
          )}

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
