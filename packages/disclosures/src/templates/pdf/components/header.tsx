import { Text, View } from "@react-pdf/renderer";
import type { StateDisclosureConfig } from "../../../types";

type HeaderProps = {
  stateConfig: StateDisclosureConfig;
  generatedDate: string;
};

export function Header({ stateConfig, generatedDate }: HeaderProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {stateConfig.legalText.header.split("\n")[0]}
      </Text>

      {stateConfig.legalText.header.split("\n")[1] && (
        <Text
          style={{
            fontSize: 9,
            textAlign: "center",
            color: "#666",
            marginBottom: 4,
          }}
        >
          {stateConfig.legalText.header.split("\n")[1]}
        </Text>
      )}

      <Text
        style={{
          fontSize: 8,
          textAlign: "center",
          color: "#999",
        }}
      >
        Template Version: {stateConfig.version} | Effective:{" "}
        {stateConfig.effectiveDate} | Generated: {generatedDate}
      </Text>

      <View
        style={{
          borderBottom: "1px solid #e2e8f0",
          marginTop: 12,
        }}
      />
    </View>
  );
}
