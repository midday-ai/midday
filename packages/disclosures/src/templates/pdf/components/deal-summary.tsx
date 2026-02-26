import { Text, View } from "@react-pdf/renderer";
import type { DisclosurePartyInfo } from "../../../types";

type DealSummaryProps = {
  partyInfo: DisclosurePartyInfo;
};

const labelStyle = {
  fontSize: 8,
  fontWeight: 600 as const,
  color: "#64748b",
  marginBottom: 2,
};

const valueStyle = {
  fontSize: 9,
  marginBottom: 6,
};

export function DealSummary({ partyInfo }: DealSummaryProps) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 20 }}>
      {/* Funder / Provider */}
      <View style={{ flex: 1, marginRight: 20 }}>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>
          Provider
        </Text>
        <Text style={labelStyle}>Name</Text>
        <Text style={valueStyle}>{partyInfo.funderName}</Text>
        <Text style={labelStyle}>Address</Text>
        <Text style={valueStyle}>{partyInfo.funderAddress}</Text>
      </View>

      {/* Merchant / Recipient */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: 600, marginBottom: 6 }}>
          Recipient
        </Text>
        <Text style={labelStyle}>Name</Text>
        <Text style={valueStyle}>{partyInfo.merchantName}</Text>
        <Text style={labelStyle}>Address</Text>
        <Text style={valueStyle}>{partyInfo.merchantAddress}</Text>
        <Text style={labelStyle}>Deal Code</Text>
        <Text style={valueStyle}>{partyInfo.dealCode}</Text>
        <Text style={labelStyle}>Funded Date</Text>
        <Text style={valueStyle}>{partyInfo.fundedDate}</Text>
      </View>
    </View>
  );
}
