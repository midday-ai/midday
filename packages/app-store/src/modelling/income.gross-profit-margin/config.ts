import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const grossProfitMarginModelling: IntegrationConfig = {
  name: "Gross Profit Margin Analysis",
  id: "gross-profit-margin-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze your profit after deducting direct production costs.",
  description:
    "Gross Profit Margin Analysis measures how much profit your business makes after deducting the costs directly associated with production. It provides insights into your pricing strategy and production efficiency.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "revenue",
      label: "Revenue",
      description: "Enter your total revenue",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "cogs",
      label: "Cost of Goods Sold (COGS)",
      description: "Enter your total cost of goods sold",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "time_period",
      label: "Time Period",
      description: "Select the time period for the analysis",
      type: "select",
      required: true,
      value: "monthly",
      options: ["monthly", "quarterly", "annually"],
    },
  ],
  config: {
    resultFields: [
      { id: "gross_profit_margin", label: "Gross Profit Margin (%)" },
      { id: "gross_profit", label: "Gross Profit" },
      { id: "revenue", label: "Revenue" },
    ],
  },
  equation: {
    formula:
      "Gross Profit Margin = ((Revenue - Cost of Goods Sold) / Revenue) × 100",
    variables: {
      Revenue: {
        label: "Revenue",
        description: "Total revenue for the period",
        unit: "currency",
      },
      "Cost of Goods Sold": {
        label: "Cost of Goods Sold",
        description:
          "Total direct costs associated with producing goods or services",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const revenue = variables["Revenue"] ?? 0;
      const cogs = variables["Cost of Goods Sold"] ?? 0;

      const grossProfit = revenue - cogs;
      const grossProfitMargin =
        revenue !== 0 ? (grossProfit / revenue) * 100 : 0;

      return {
        gross_profit_margin: grossProfitMargin,
        gross_profit: grossProfit,
        revenue: revenue,
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

export default grossProfitMarginModelling;
