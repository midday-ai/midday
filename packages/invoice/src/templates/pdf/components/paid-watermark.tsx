import { TZDate } from "@date-fns/tz";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

type Props = {
  paidAt?: string | null;
  dateFormat?: string;
  timezone?: string;
};

export function PaidWatermark({
  paidAt,
  dateFormat = "MM/dd/yyyy",
  timezone,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 16,
      }}
    >
      <View
        style={{
          transform: "rotate(-12deg)",
          alignItems: "center",
        }}
      >
        <View
          style={{
            borderWidth: 1.5,
            borderColor: "#DC2626",
            paddingVertical: 6,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "Inter",
              color: "#DC2626",
              letterSpacing: 4,
            }}
          >
            PAID
          </Text>
        </View>
        {paidAt && (
          <Text
            style={{
              fontSize: 9,
              color: "#666666",
              marginTop: 6,
            }}
          >
            {format(new TZDate(paidAt, timezone || "UTC"), dateFormat)}
          </Text>
        )}
      </View>
    </View>
  );
}
