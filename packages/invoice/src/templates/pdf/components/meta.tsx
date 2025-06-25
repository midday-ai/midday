import { TZDate } from "@date-fns/tz";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

interface MetaProps {
  invoiceNo?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  invoiceNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  dateFormat?: string;
  timezone: string;
  title: string;
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
  title,
}: MetaProps) {
  return (
    <View>
      <Text style={{ fontSize: 21, fontWeight: 500, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ flexDirection: "column", gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
            {invoiceNoLabel ? `${invoiceNoLabel}:` : ""}
          </Text>
          <Text style={{ fontSize: 9 }}>{invoiceNo}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
            {issueDateLabel ? `${issueDateLabel}:` : ""}
          </Text>
          <Text style={{ fontSize: 9 }}>
            {issueDate
              ? format(new TZDate(issueDate, timezone), dateFormat)
              : ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
            {dueDateLabel ? `${dueDateLabel}:` : ""}
          </Text>
          <Text style={{ fontSize: 9 }}>
            {dueDate ? format(new TZDate(dueDate, timezone), dateFormat) : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}
