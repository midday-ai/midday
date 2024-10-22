import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const cvpAnalysisExpenseModelling: IntegrationConfig = {
  name: "Cost-Volume-Profit (CVP) Analysis",
  id: "cvp-analysis-profit",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze how changes in costs and volume affect profitability.",
  description:
    "Cost-Volume-Profit (CVP) Analysis helps assess how changes in costs and volume affect your profitability. It uses the formula: Profit = (Sales Volume × Price per Unit) - (Fixed Costs + Variable Costs) to provide insights into your business's financial performance and break-even point.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "sales_volume",
      label: "Sales Volume",
      description: "Enter the number of units sold",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "price_per_unit",
      label: "Price per Unit",
      description: "Enter the selling price per unit of your product",
      type: "number",
      required: true,
      value: 0,
      min: 0.01,
    },
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
      id: "variable_cost_per_unit",
      label: "Variable Cost per Unit",
      description:
        "Enter the variable cost per unit of your product (e.g., materials, direct labor)",
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
      { id: "total_revenue", label: "Total Revenue" },
      { id: "total_costs", label: "Total Costs" },
      { id: "profit", label: "Profit" },
      { id: "break_even_point", label: "Break-Even Point (Units)" },
      { id: "contribution_margin", label: "Contribution Margin" },
    ],
  },
  equation: {
    formula:
      "Profit = (Sales Volume × Price per Unit) - (Fixed Costs + Variable Costs)",
    variables: {
      "Sales Volume": {
        label: "Sales Volume",
        description: "Number of units sold",
        unit: "units",
      },
      "Price per Unit": {
        label: "Price per Unit",
        description: "Selling price per unit",
        unit: "currency",
      },
      "Fixed Costs": {
        label: "Fixed Costs",
        description: "Total fixed costs (e.g., rent, salaries)",
        unit: "currency",
      },
      "Variable Costs": {
        label: "Variable Costs",
        description: "Total variable costs (per unit)",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const salesVolume = variables["Sales Volume"] ?? 0;
      const pricePerUnit = variables["Price per Unit"] ?? 0;
      const fixedCosts = variables["Fixed Costs"] ?? 0;
      const variableCostPerUnit = variables["Variable Costs"] ?? 0;

      const totalRevenue = salesVolume * pricePerUnit;
      const totalVariableCosts = salesVolume * variableCostPerUnit;
      const totalCosts = fixedCosts + totalVariableCosts;
      const profit = totalRevenue - totalCosts;
      const breakEvenPoint = fixedCosts / (pricePerUnit - variableCostPerUnit);
      const contributionMargin = pricePerUnit - variableCostPerUnit;

      return {
        total_revenue: totalRevenue,
        total_costs: totalCosts,
        profit,
        break_even_point: breakEvenPoint,
        contribution_margin: contributionMargin,
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

export default cvpAnalysisExpenseModelling;
