import { Text, View } from "@react-pdf/renderer";

export function SignatureBlock() {
  return (
    <View style={{ marginTop: 20, marginBottom: 20 }}>
      <View
        style={{
          borderTop: "1px solid #e2e8f0",
          paddingTop: 12,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          ACKNOWLEDGMENT
        </Text>
        <Text
          style={{
            fontSize: 8,
            lineHeight: 1.5,
            color: "#374151",
            marginBottom: 16,
          }}
        >
          By signing below, I acknowledge that I have received and reviewed this
          commercial financing disclosure. I understand the terms, costs, and
          conditions described herein. This acknowledgment does not constitute
          acceptance of the financing offer.
        </Text>

        {/* Signature lines */}
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <View style={{ flex: 1, marginRight: 20 }}>
            <View
              style={{ borderBottom: "1px solid #000", marginBottom: 4, height: 30 }}
            />
            <Text style={{ fontSize: 8, color: "#64748b" }}>
              Merchant / Authorized Representative Signature
            </Text>
          </View>
          <View style={{ width: 150 }}>
            <View
              style={{ borderBottom: "1px solid #000", marginBottom: 4, height: 30 }}
            />
            <Text style={{ fontSize: 8, color: "#64748b" }}>Date</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 16 }}>
          <View style={{ flex: 1, marginRight: 20 }}>
            <View
              style={{ borderBottom: "1px solid #000", marginBottom: 4, height: 20 }}
            />
            <Text style={{ fontSize: 8, color: "#64748b" }}>
              Print Name
            </Text>
          </View>
          <View style={{ width: 150 }}>
            <View
              style={{ borderBottom: "1px solid #000", marginBottom: 4, height: 20 }}
            />
            <Text style={{ fontSize: 8, color: "#64748b" }}>Title</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
