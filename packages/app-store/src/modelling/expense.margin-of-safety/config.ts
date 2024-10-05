import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const marginOfSafetyExpenseModelling: ModellingIntegrationConfig = {
  name: "Margin of Safety Analysis",
  id: "margin-of-safety-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description: "Calculate the margin of safety for your business.",
  description:
    "Margin of Safety Analysis helps determine how much sales can drop before reaching the break-even point. It provides insights into the financial cushion your business has and helps in assessing risk.",
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
      id: "break_even_sales",
      label: "Break-Even Sales",
      description: "Enter your break-even sales amount",
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
      { id: "margin_of_safety_percentage", label: "Margin of Safety (%)" },
      { id: "margin_of_safety_value", label: "Margin of Safety (Value)" },
      { id: "break_even_sales", label: "Break-Even Sales" },
    ],
  },
  equation: {
    formula:
      "Margin of Safety = (Current Sales - Break-Even Sales) / Current Sales × 100",
    variables: {
      "Current Sales": {
        label: "Current Sales",
        description: "Total current sales amount",
        unit: "currency",
      },
      "Break-Even Sales": {
        label: "Break-Even Sales",
        description: "Sales amount at which total costs equal total revenue",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const currentSales = variables["Current Sales"] ?? 0;
      const breakEvenSales = variables["Break-Even Sales"] ?? 0;

      const marginOfSafetyValue = currentSales - breakEvenSales;
      const marginOfSafetyPercentage =
        currentSales !== 0 ? (marginOfSafetyValue / currentSales) * 100 : 0;

      return {
        margin_of_safety_percentage: marginOfSafetyPercentage,
        margin_of_safety_value: marginOfSafetyValue,
        break_even_sales: breakEvenSales,
      };
    },
  },
};

export default marginOfSafetyExpenseModelling;
