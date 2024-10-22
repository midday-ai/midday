import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const fixedVsVariableCostRatioModelling: IntegrationConfig = {
  name: "Fixed vs. Variable Cost Ratio",
  id: "fixed-vs-variable-cost-ratio",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Calculate the ratio of fixed costs to total costs in your business.",
  description:
    "This model helps you understand how dependent your business is on fixed expenses versus variable costs. It calculates the ratio of fixed costs to total costs, providing insights into your cost structure.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "fixed_costs",
      label: "Fixed Costs",
      description: "Enter your total fixed costs (e.g., rent, salaries)",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "total_costs",
      label: "Total Costs",
      description: "Enter your total costs (fixed + variable)",
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
      { id: "cost_ratio", label: "Fixed to Total Cost Ratio" },
      { id: "fixed_cost_percentage", label: "Fixed Costs Percentage" },
      { id: "variable_cost_percentage", label: "Variable Costs Percentage" },
    ],
  },
  equation: {
    formula: "Cost Ratio = Fixed Costs / Total Costs",
    variables: {
      "Fixed Costs": {
        label: "Fixed Costs",
        description: "Total fixed costs (e.g., rent, salaries)",
        unit: "currency",
      },
      "Total Costs": {
        label: "Total Costs",
        description: "Sum of fixed and variable costs",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const fixedCosts = variables["Fixed Costs"] ?? 0;
      const totalCosts = variables["Total Costs"] ?? 0;
      const costRatio = totalCosts !== 0 ? fixedCosts / totalCosts : 0;
      const fixedCostPercentage = (costRatio * 100).toFixed(2);
      const variableCostPercentage = (
        100 - parseFloat(fixedCostPercentage)
      ).toFixed(2);

      return {
        cost_ratio: costRatio,
        fixed_cost_percentage: parseFloat(fixedCostPercentage),
        variable_cost_percentage: parseFloat(variableCostPercentage),
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

export default fixedVsVariableCostRatioModelling;
