import { TZDate } from "@date-fns/tz";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

interface MetaProps {
  dealNo?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  dealNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  dateFormat?: string;
  timezone: string;
  title: string;
}

export function Meta({
  dealNo,
  issueDate,
  dueDate,
  dealNoLabel,
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
            {dealNoLabel ? `${dealNoLabel}:` : ""}
          </Text>
          <Text style={{ fontSize: 9 }}>{dealNo}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
            {issueDateLabel ? `${issueDateLabel}:` : ""}
          </Text>
          <Text style={{ fontSize: 9 }}>
            {issueDate
              ? format(new TZDate(issueDate, "UTC"), dateFormat)
              : ""}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 9, fontWeight: 500, marginRight: 2 }}>
            {dueDateLabel ? `${dueDateLabel}:` : ""}
          </Text>
          <Text style={{ fontSize: 9 }}>
            {dueDate ? format(new TZDate(dueDate, "UTC"), dateFormat) : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}
