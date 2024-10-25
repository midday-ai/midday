import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const breakEvenAnalysisExpenseModelling: IntegrationConfig = {
  name: "Break-Even Analysis",
  id: "break-even-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description: "Calculate your break-even point and profit projections.",
  description:
    "Break-Even Analysis helps determine how many units of a product you need to sell to cover all expenses and project potential profits. It considers fixed costs, price per unit, and variable cost per unit to calculate the break-even point and provide insights into your business's financial performance.",
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
      id: "price_per_unit",
      label: "Price per Unit",
      description: "Enter the selling price per unit of your product",
      type: "number",
      required: true,
      value: 0,
      min: 0.01,
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
      id: "sales_volume",
      label: "Sales Volume",
      description: "Enter the expected number of units sold",
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
      { id: "break_even_point", label: "Break-Even Point (Units)" },
      { id: "break_even_revenue", label: "Break-Even Revenue" },
      { id: "profit_margin", label: "Profit Margin (%)" },
      { id: "total_revenue", label: "Total Revenue" },
      { id: "total_costs", label: "Total Costs" },
      { id: "profit", label: "Profit" },
      { id: "contribution_margin", label: "Contribution Margin" },
    ],
  },
  equation: {
    formula:
      "Break-Even Point = Fixed Costs / (Price per Unit - Variable Cost per Unit)",
    variables: {
      "Fixed Costs": {
        label: "Fixed Costs",
        description: "Total fixed costs (e.g., rent, salaries)",
        unit: "currency",
      },
      "Price per Unit": {
        label: "Price per Unit",
        description: "Selling price per unit of your product",
        unit: "currency",
      },
      "Variable Cost per Unit": {
        label: "Variable Cost per Unit",
        description:
          "Variable cost per unit of your product (e.g., materials, direct labor)",
        unit: "currency",
      },
      "Sales Volume": {
        label: "Sales Volume",
        description: "Expected number of units sold",
        unit: "units",
      },
    },
    calculate: (variables) => {
      const fixedCosts = variables["Fixed Costs"] ?? 0;
      const pricePerUnit = variables["Price per Unit"] ?? 0;
      const variableCostPerUnit = variables["Variable Cost per Unit"] ?? 0;
      const salesVolume = variables["Sales Volume"] ?? 0;
      const breakEvenPoint =
        pricePerUnit !== 0
          ? fixedCosts / (pricePerUnit - variableCostPerUnit)
          : 0;
      const breakEvenRevenue = breakEvenPoint * pricePerUnit;
      const totalRevenue = salesVolume * pricePerUnit;
      const totalCosts = fixedCosts + variableCostPerUnit * salesVolume;
      const profit = totalRevenue - totalCosts;
      const contributionMargin = pricePerUnit - variableCostPerUnit;
      const profitMargin =
        totalRevenue !== 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        break_even_point: breakEvenPoint,
        break_even_revenue: breakEvenRevenue,
        profit_margin: profitMargin,
        total_revenue: totalRevenue,
        total_costs: totalCosts,
        profit: profit,
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

export default breakEvenAnalysisExpenseModelling;
