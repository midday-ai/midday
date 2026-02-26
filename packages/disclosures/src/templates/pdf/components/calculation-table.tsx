import { Text, View } from "@react-pdf/renderer";
import type { DisclosureFigures, StateDisclosureConfig } from "../../../types";

type CalculationTableProps = {
  figures: DisclosureFigures;
  stateConfig: StateDisclosureConfig;
};

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

const rowStyle = {
  flexDirection: "row" as const,
  borderBottom: "1px solid #f1f5f9",
  paddingVertical: 5,
};

const labelCellStyle = {
  flex: 2,
  fontSize: 9,
};

const valueCellStyle = {
  flex: 1,
  fontSize: 9,
  fontWeight: 600 as const,
  textAlign: "right" as const,
};

const sectionHeaderStyle = {
  fontSize: 10,
  fontWeight: 700 as const,
  marginTop: 12,
  marginBottom: 6,
  color: "#0f172a",
};

export function CalculationTable({
  figures,
  stateConfig,
}: CalculationTableProps) {
  const frequencyLabel = {
    daily: "Daily",
    weekly: "Weekly",
    bi_weekly: "Bi-Weekly",
    monthly: "Monthly",
  }[figures.paymentFrequency] ?? figures.paymentFrequency;

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Financing Terms */}
      <Text style={sectionHeaderStyle}>Financing Terms</Text>
      <View style={{ border: "1px solid #e2e8f0", borderRadius: 4, padding: 8 }}>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>Amount Financed</Text>
          <Text style={valueCellStyle}>
            {formatCurrency(figures.fundingAmount)}
          </Text>
        </View>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>Total Repayment Amount</Text>
          <Text style={valueCellStyle}>
            {formatCurrency(figures.totalRepaymentAmount)}
          </Text>
        </View>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>Finance Charge</Text>
          <Text style={valueCellStyle}>
            {formatCurrency(figures.financeCharge)}
          </Text>
        </View>
        <View style={{ ...rowStyle, borderBottom: "none" }}>
          <Text style={labelCellStyle}>
            Annual Percentage Rate (APR)
          </Text>
          <Text style={valueCellStyle}>
            {formatPercent(figures.annualPercentageRate)}
          </Text>
        </View>
      </View>

      {/* Payment Schedule */}
      <Text style={sectionHeaderStyle}>Payment Schedule</Text>
      <View style={{ border: "1px solid #e2e8f0", borderRadius: 4, padding: 8 }}>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>{frequencyLabel} Payment Amount</Text>
          <Text style={valueCellStyle}>
            {formatCurrency(figures.paymentAmount)}
          </Text>
        </View>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>Number of Payments</Text>
          <Text style={valueCellStyle}>
            {figures.numberOfPayments}
          </Text>
        </View>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>Term Length</Text>
          <Text style={valueCellStyle}>
            {figures.termLengthDays} days
          </Text>
        </View>
        <View style={{ ...rowStyle, borderBottom: "none" }}>
          <Text style={labelCellStyle}>Average Monthly Cost</Text>
          <Text style={valueCellStyle}>
            {formatCurrency(figures.averageMonthlyCost)}
          </Text>
        </View>
      </View>

      {/* Additional Metrics */}
      <Text style={sectionHeaderStyle}>Additional Information</Text>
      <View style={{ border: "1px solid #e2e8f0", borderRadius: 4, padding: 8 }}>
        <View style={rowStyle}>
          <Text style={labelCellStyle}>
            Cents on the Dollar (Factor Rate)
          </Text>
          <Text style={valueCellStyle}>{figures.centsOnDollar}</Text>
        </View>

        {figures.totalFees > 0 && (
          <View style={rowStyle}>
            <Text style={labelCellStyle}>Total Fees</Text>
            <Text style={valueCellStyle}>
              {formatCurrency(figures.totalFees)}
            </Text>
          </View>
        )}

        {figures.feeBreakdown.map((fee, i) => (
          <View key={i} style={rowStyle}>
            <Text style={{ ...labelCellStyle, paddingLeft: 12 }}>
              {fee.name}
            </Text>
            <Text style={valueCellStyle}>
              {formatCurrency(fee.amount)}
            </Text>
          </View>
        ))}

        {figures.prepaymentSavingsEstimate !== null && (
          <View style={{ ...rowStyle, borderBottom: "none" }}>
            <Text style={labelCellStyle}>
              Estimated Prepayment Savings (at midpoint)
            </Text>
            <Text style={valueCellStyle}>
              {formatCurrency(figures.prepaymentSavingsEstimate)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
