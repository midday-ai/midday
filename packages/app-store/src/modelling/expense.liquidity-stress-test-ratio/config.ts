import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const quickRatioExpenseModelling: ModellingIntegrationConfig = {
  name: "Liquidity Stress Test (Quick Ratio)",
  id: "quick-ratio-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze your ability to meet short-term liabilities with readily available assets.",
  description:
    "The Quick Ratio, also known as the Acid Test, measures a company's ability to pay its short-term obligations with its most liquid assets. It provides insights into your business's financial health and ability to meet immediate liabilities.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "current_assets",
      label: "Current Assets",
      description: "Enter your total current assets",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "inventory",
      label: "Inventory",
      description: "Enter the value of your inventory",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "current_liabilities",
      label: "Current Liabilities",
      description: "Enter your total current liabilities",
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
      { id: "quick_ratio", label: "Quick Ratio" },
      { id: "quick_assets", label: "Quick Assets" },
      { id: "current_liabilities", label: "Current Liabilities" },
    ],
  },
  equation: {
    formula: "Quick Ratio = (Current Assets - Inventory) / Current Liabilities",
    variables: {
      "Current Assets": {
        label: "Current Assets",
        description: "Total current assets of the company",
        unit: "currency",
      },
      Inventory: {
        label: "Inventory",
        description: "Value of the company's inventory",
        unit: "currency",
      },
      "Current Liabilities": {
        label: "Current Liabilities",
        description: "Total current liabilities of the company",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const currentAssets = variables["Current Assets"] ?? 0;
      const inventory = variables["Inventory"] ?? 0;
      const currentLiabilities = variables["Current Liabilities"] ?? 0;

      const quickAssets = currentAssets - inventory;
      const quickRatio =
        currentLiabilities !== 0 ? quickAssets / currentLiabilities : 0;

      return {
        quick_ratio: quickRatio,
        quick_assets: quickAssets,
        current_liabilities: currentLiabilities,
      };
    },
  },
};

export default quickRatioExpenseModelling;
