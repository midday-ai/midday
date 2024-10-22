import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const dolAnalysisExpenseModelling: IntegrationConfig = {
  name: "Degree of Operating Leverage (DOL) Analysis",
  id: "dol-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description: "Analyze the impact of operating leverage on earnings.",
  description:
    "Degree of Operating Leverage (DOL) Analysis measures the effect of operating leverage on a company's earnings before interest and taxes (EBIT) when sales change. It helps assess the sensitivity of a company's operating income to changes in sales volume.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "current_sales",
      label: "Current Sales",
      description: "Enter your current sales amount",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "current_ebit",
      label: "Current EBIT",
      description:
        "Enter your current Earnings Before Interest and Taxes (EBIT)",
      type: "number",
      required: true,
      value: 0,
    },
    {
      id: "fixed_costs",
      label: "Fixed Costs",
      description: "Enter your total fixed costs",
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
      { id: "dol", label: "Degree of Operating Leverage" },
      { id: "contribution_margin", label: "Contribution Margin" },
      { id: "break_even_point", label: "Break-Even Point" },
    ],
  },
  equation: {
    formula:
      "DOL = (Current Sales - Variable Costs) / (Current Sales - Variable Costs - Fixed Costs)",
    variables: {
      "Current Sales": {
        label: "Current Sales",
        description: "Total current sales amount",
        unit: "currency",
      },
      "Current EBIT": {
        label: "Current EBIT",
        description: "Current Earnings Before Interest and Taxes",
        unit: "currency",
      },
      "Fixed Costs": {
        label: "Fixed Costs",
        description: "Total fixed costs",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const currentSales = variables["Current Sales"] ?? 0;
      const currentEBIT = variables["Current EBIT"] ?? 0;
      const fixedCosts = variables["Fixed Costs"] ?? 0;

      const contributionMargin =
        currentSales - (currentSales - currentEBIT - fixedCosts);
      const dol = contributionMargin / currentEBIT;
      const breakEvenPoint = fixedCosts / (contributionMargin / currentSales);

      return {
        dol,
        contribution_margin: contributionMargin,
        break_even_point: breakEvenPoint,
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

export default dolAnalysisExpenseModelling;
