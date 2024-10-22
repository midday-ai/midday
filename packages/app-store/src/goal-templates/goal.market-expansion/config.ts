import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const marketExpansionGoalTemplate: IntegrationConfig = {
  name: "Market Expansion Goal Template",
  id: "market-expansion-goal-template",
  category: IntegrationCategory.GoalTemplates,
  active: true,
  logo: Logo,
  short_description: "Set and track market expansion goals for your business.",
  description:
    "This Market Expansion Goal Template helps you define, track, and achieve objectives related to entering new markets or expanding market share. It considers metrics such as Market Share, New Market Revenue, and Geographic Expansion.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "current_market_size",
      label: "Current Market Size",
      description: "Enter the total size of your current market",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "current_market_share",
      label: "Current Market Share (%)",
      description: "Enter your current market share percentage",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_market_share",
      label: "Target Market Share (%)",
      description: "Enter your target market share percentage",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "new_market_size",
      label: "New Market Size",
      description: "Enter the total size of the new market you're targeting",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_new_market_share",
      label: "Target New Market Share (%)",
      description:
        "Enter your target market share percentage in the new market",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "current_geographic_presence",
      label: "Current Geographic Presence",
      description:
        "Enter the number of geographic locations you currently operate in",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_geographic_presence",
      label: "Target Geographic Presence",
      description: "Enter the target number of geographic locations",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
  ],
  config: {
    resultFields: [
      { id: "market_share_growth", label: "Market Share Growth (%)" },
      { id: "new_market_revenue", label: "Projected New Market Revenue" },
      { id: "geographic_expansion", label: "Geographic Expansion" },
      { id: "total_market_coverage", label: "Total Market Coverage" },
    ],
  },
  equation: {
    formula: "Market Share Growth = Target Market Share - Current Market Share",
    variables: {
      "Current Market Size": {
        label: "Current Market Size",
        description: "Total size of your current market",
        unit: "currency",
      },
      "Current Market Share": {
        label: "Current Market Share",
        description: "Your current market share percentage",
        unit: "percentage",
      },
      "New Market Size": {
        label: "New Market Size",
        description: "Total size of the new market you're targeting",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const currentMarketSize = variables["Current Market Size"] ?? 0;
      const currentMarketShare = variables["Current Market Share"] ?? 0;
      const targetMarketShare = variables["Target Market Share (%)"] ?? 0;
      const newMarketSize = variables["New Market Size"] ?? 0;
      const targetNewMarketShare =
        variables["Target New Market Share (%)"] ?? 0;
      const currentGeographicPresence =
        variables["Current Geographic Presence"] ?? 0;
      const targetGeographicPresence =
        variables["Target Geographic Presence"] ?? 0;

      const marketShareGrowth = targetMarketShare - currentMarketShare;
      const newMarketRevenue = (newMarketSize * targetNewMarketShare) / 100;
      const geographicExpansion =
        targetGeographicPresence - currentGeographicPresence;
      const totalMarketCoverage =
        (((currentMarketSize * targetMarketShare) / 100 + newMarketRevenue) /
          (currentMarketSize + newMarketSize)) *
        100;

      return {
        market_share_growth: marketShareGrowth,
        new_market_revenue: newMarketRevenue,
        geographic_expansion: geographicExpansion,
        total_market_coverage: totalMarketCoverage,
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

export default marketExpansionGoalTemplate;
