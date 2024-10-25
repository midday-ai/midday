import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const profitabilityGoalTemplate: IntegrationConfig = {
  name: "Profitability Goal Template",
  id: "profitability-goal-template",
  category: IntegrationCategory.GoalTemplates,
  active: true,
  logo: Logo,
  short_description: "Set and track profitability goals for your business.",
  description:
    "This Profitability Goal Template helps you define, track, and achieve objectives related to improving overall business profitability. It considers metrics such as Gross Profit Margin, Net Profit Margin, and Return on Investment.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "revenue",
      label: "Total Revenue",
      description: "Enter your total revenue",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "cogs",
      label: "Cost of Goods Sold",
      description: "Enter your total cost of goods sold",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "operating_expenses",
      label: "Operating Expenses",
      description: "Enter your total operating expenses",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "investment",
      label: "Total Investment",
      description: "Enter the total amount invested in the business",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_gross_margin",
      label: "Target Gross Profit Margin (%)",
      description: "Enter your target gross profit margin",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_net_margin",
      label: "Target Net Profit Margin (%)",
      description: "Enter your target net profit margin",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_roi",
      label: "Target Return on Investment (%)",
      description: "Enter your target return on investment",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
  ],
  config: {
    resultFields: [
      { id: "current_gross_margin", label: "Current Gross Profit Margin (%)" },
      { id: "current_net_margin", label: "Current Net Profit Margin (%)" },
      { id: "current_roi", label: "Current Return on Investment (%)" },
      { id: "gross_margin_gap", label: "Gross Margin Gap (%)" },
      { id: "net_margin_gap", label: "Net Margin Gap (%)" },
      { id: "roi_gap", label: "ROI Gap (%)" },
    ],
  },
  equation: {
    formula: "Gross Profit Margin = (Revenue - COGS) / Revenue * 100",
    variables: {
      Revenue: {
        label: "Revenue",
        description: "Total revenue of the business",
        unit: "currency",
      },
      COGS: {
        label: "Cost of Goods Sold",
        description: "Total cost of goods sold",
        unit: "currency",
      },
      "Operating Expenses": {
        label: "Operating Expenses",
        description: "Total operating expenses",
        unit: "currency",
      },
      Investment: {
        label: "Total Investment",
        description: "Total amount invested in the business",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const revenue = variables["Revenue"] ?? 0;
      const cogs = variables["COGS"] ?? 0;
      const operatingExpenses = variables["Operating Expenses"] ?? 0;
      const investment = variables["Investment"] ?? 0;
      const targetGrossMargin =
        variables["Target Gross Profit Margin (%)"] ?? 0;
      const targetNetMargin = variables["Target Net Profit Margin (%)"] ?? 0;
      const targetROI = variables["Target Return on Investment (%)"] ?? 0;

      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - operatingExpenses;

      const currentGrossMargin =
        revenue !== 0 ? (grossProfit / revenue) * 100 : 0;
      const currentNetMargin = revenue !== 0 ? (netProfit / revenue) * 100 : 0;
      const currentROI = investment !== 0 ? (netProfit / investment) * 100 : 0;

      const grossMarginGap = targetGrossMargin - currentGrossMargin;
      const netMarginGap = targetNetMargin - currentNetMargin;
      const roiGap = targetROI - currentROI;

      return {
        current_gross_margin: currentGrossMargin,
        current_net_margin: currentNetMargin,
        current_roi: currentROI,
        gross_margin_gap: grossMarginGap,
        net_margin_gap: netMarginGap,
        roi_gap: roiGap,
      };
    },
  },
  model_type: ModelType.FinancialModel,
  api_version: "v1.0.0",
  is_public: false,
  tags: ["analysis", "financial", "projection"],
  integration_type: undefined,
  webhook_url: "https://gateway.solomon-ai-platform.com",
  supported_features: undefined,
  last_sync_at: new Date().toISOString(),
  sync_status: undefined,
  auth_method: "none",
};

export default profitabilityGoalTemplate;
