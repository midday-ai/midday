import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const expenseGrowthRateModelling: IntegrationConfig = {
  name: "Expense Growth Rate Analysis",
  id: "expense-growth-rate-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Track the growth rate of your expenses to identify trends.",
  description:
    "Expense Growth Rate Analysis helps you regularly track the growth rate of your expenses to identify trends that may stress your cash flow. It calculates the percentage change in expenses between two periods.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "current_expenses",
      label: "Current Expenses",
      description: "Enter your total expenses for the current period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "previous_expenses",
      label: "Previous Expenses",
      description: "Enter your total expenses for the previous period",
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
      { id: "expense_growth_rate", label: "Expense Growth Rate (%)" },
      { id: "expense_increase", label: "Expense Increase" },
      { id: "previous_expenses", label: "Previous Expenses" },
    ],
  },
  equation: {
    formula:
      "Expense Growth Rate = ((Current Expenses - Previous Expenses) / Previous Expenses) × 100",
    variables: {
      "Current Expenses": {
        label: "Current Expenses",
        description: "Total expenses for the current period",
        unit: "currency",
      },
      "Previous Expenses": {
        label: "Previous Expenses",
        description: "Total expenses for the previous period",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const currentExpenses = variables["Current Expenses"] ?? 0;
      const previousExpenses = variables["Previous Expenses"] ?? 0;

      const expenseIncrease = currentExpenses - previousExpenses;
      const expenseGrowthRate =
        previousExpenses !== 0 ? (expenseIncrease / previousExpenses) * 100 : 0;

      return {
        expense_growth_rate: expenseGrowthRate,
        expense_increase: expenseIncrease,
        previous_expenses: previousExpenses,
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

export default expenseGrowthRateModelling;
