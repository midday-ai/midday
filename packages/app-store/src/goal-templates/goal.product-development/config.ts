import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const productDevelopmentGoalTemplate: ModellingIntegrationConfig = {
  name: "Product Development Goal Template",
  id: "product-development-goal-template",
  category: IntegrationCategory.GoalTemplates,
  active: false,
  logo: Logo,
  short_description:
    "Set and track product development goals for your business.",
  description:
    "This Product Development Goal Template helps you define, track, and achieve objectives related to creating or improving products/services. It considers metrics such as New Product Revenue, Time to Market, and R&D Expenses Ratio.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "total_revenue",
      label: "Total Revenue",
      description: "Enter your total revenue",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "new_product_revenue",
      label: "New Product Revenue",
      description: "Enter the revenue from new products/services",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "average_development_time",
      label: "Average Development Time (months)",
      description: "Enter the average time to develop a new product",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "rd_expenses",
      label: "R&D Expenses",
      description: "Enter your total R&D expenses",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_new_product_revenue_percentage",
      label: "Target New Product Revenue (%)",
      description: "Enter your target percentage of revenue from new products",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_time_to_market",
      label: "Target Time to Market (months)",
      description: "Enter your target time to bring a new product to market",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_rd_expenses_ratio",
      label: "Target R&D Expenses Ratio (%)",
      description: "Enter your target R&D expenses as a percentage of revenue",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
  ],
  config: {
    resultFields: [
      {
        id: "current_new_product_revenue_percentage",
        label: "Current New Product Revenue (%)",
      },
      {
        id: "current_time_to_market",
        label: "Current Time to Market (months)",
      },
      {
        id: "current_rd_expenses_ratio",
        label: "Current R&D Expenses Ratio (%)",
      },
      { id: "new_product_revenue_gap", label: "New Product Revenue Gap (%)" },
      {
        id: "time_to_market_improvement",
        label: "Time to Market Improvement (months)",
      },
      { id: "rd_expenses_ratio_gap", label: "R&D Expenses Ratio Gap (%)" },
    ],
  },
  equation: {
    formula:
      "New Product Revenue (%) = (New Product Revenue / Total Revenue) * 100",
    variables: {
      "Total Revenue": {
        label: "Total Revenue",
        description: "Total revenue of the business",
        unit: "currency",
      },
      "New Product Revenue": {
        label: "New Product Revenue",
        description: "Revenue from new products/services",
        unit: "currency",
      },
      "Average Development Time": {
        label: "Average Development Time",
        description: "Average time to develop a new product",
        unit: "months",
      },
      "R&D Expenses": {
        label: "R&D Expenses",
        description: "Total R&D expenses",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const totalRevenue = variables["Total Revenue"] ?? 0;
      const newProductRevenue = variables["New Product Revenue"] ?? 0;
      const averageDevelopmentTime = variables["Average Development Time"] ?? 0;
      const rdExpenses = variables["R&D Expenses"] ?? 0;
      const targetNewProductRevenuePercentage =
        variables["Target New Product Revenue (%)"] ?? 0;
      const targetTimeToMarket =
        variables["Target Time to Market (months)"] ?? 0;
      const targetRdExpensesRatio =
        variables["Target R&D Expenses Ratio (%)"] ?? 0;

      const currentNewProductRevenuePercentage =
        totalRevenue !== 0 ? (newProductRevenue / totalRevenue) * 100 : 0;
      const currentTimeToMarket = averageDevelopmentTime;
      const currentRdExpensesRatio =
        totalRevenue !== 0 ? (rdExpenses / totalRevenue) * 100 : 0;

      const newProductRevenueGap =
        targetNewProductRevenuePercentage - currentNewProductRevenuePercentage;
      const timeToMarketImprovement = currentTimeToMarket - targetTimeToMarket;
      const rdExpensesRatioGap = targetRdExpensesRatio - currentRdExpensesRatio;

      return {
        current_new_product_revenue_percentage:
          currentNewProductRevenuePercentage,
        current_time_to_market: currentTimeToMarket,
        current_rd_expenses_ratio: currentRdExpensesRatio,
        new_product_revenue_gap: newProductRevenueGap,
        time_to_market_improvement: timeToMarketImprovement,
        rd_expenses_ratio_gap: rdExpensesRatioGap,
      };
    },
  },
};

export default productDevelopmentGoalTemplate;
