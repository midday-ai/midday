import { TZDate } from "@date-fns/tz";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

interface MetaProps {
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  invoiceNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  dateFormat?: string;
  timezone: string;
}

export function Meta({
  invoiceNo,
  issueDate,
  dueDate,
  invoiceNoLabel,
  issueDateLabel,
  dueDateLabel,
  dateFormat = "MM/dd/yyyy",
  timezone,
}: MetaProps) {
  return (
    <View style={{ flexDirection: "column", gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
          {invoiceNoLabel}:
        </Text>
        <Text style={{ fontSize: 9 }}>{invoiceNo}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: 500,
            marginRight: 2,
          }}
        >
          {issueDateLabel}:
        </Text>
        <Text style={{ fontSize: 9 }}>
          {format(new TZDate(issueDate, timezone), dateFormat)}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
          {dueDateLabel}:
        </Text>
        <Text style={{ fontSize: 9 }}>
          {format(new TZDate(dueDate, timezone), dateFormat)}
        </Text>
      </View>
    </View>
  );
}
