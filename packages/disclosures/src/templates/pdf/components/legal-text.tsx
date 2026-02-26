import { Text, View } from "@react-pdf/renderer";
import type { StateDisclosureConfig } from "../../../types";

type LegalTextProps = {
  stateConfig: StateDisclosureConfig;
};

const sectionStyle = {
  marginBottom: 10,
};

const headingStyle = {
  fontSize: 9,
  fontWeight: 700 as const,
  marginBottom: 4,
  color: "#0f172a",
};

const bodyStyle = {
  fontSize: 8,
  lineHeight: 1.5,
  color: "#374151",
};

export function LegalText({ stateConfig }: LegalTextProps) {
  const { legalText } = stateConfig;

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Disclosure Notice */}
      <View style={sectionStyle}>
        <Text style={headingStyle}>DISCLOSURE NOTICE</Text>
        <Text style={bodyStyle}>{legalText.disclosureNotice}</Text>
      </View>

      {/* Prepayment Policy */}
      <View style={sectionStyle}>
        <Text style={headingStyle}>PREPAYMENT POLICY</Text>
        <Text style={bodyStyle}>{legalText.prepaymentPolicy}</Text>
      </View>

      {/* Collateral Requirements (if applicable) */}
      {legalText.collateralRequirements && (
        <View style={sectionStyle}>
          <Text style={headingStyle}>COLLATERAL REQUIREMENTS</Text>
          <Text style={bodyStyle}>{legalText.collateralRequirements}</Text>
        </View>
      )}

      {/* Personal Guarantee (if applicable) */}
      {legalText.personalGuarantee && (
        <View style={sectionStyle}>
          <Text style={headingStyle}>PERSONAL GUARANTEE</Text>
          <Text style={bodyStyle}>{legalText.personalGuarantee}</Text>
        </View>
      )}

      {/* Right of Recission (if applicable) */}
      {legalText.rightOfRecission && (
        <View style={sectionStyle}>
          <Text style={headingStyle}>RIGHT OF RECISSION</Text>
          <Text style={bodyStyle}>{legalText.rightOfRecission}</Text>
        </View>
      )}

      {/* Additional Terms */}
      {legalText.additionalTerms.length > 0 && (
        <View style={sectionStyle}>
          <Text style={headingStyle}>ADDITIONAL TERMS</Text>
          {legalText.additionalTerms.map((term, i) => (
            <Text key={i} style={{ ...bodyStyle, marginBottom: 4 }}>
              {i + 1}. {term}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
