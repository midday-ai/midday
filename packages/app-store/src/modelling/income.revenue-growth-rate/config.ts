import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const revenueGrowthRateModelling: ModellingIntegrationConfig = {
  name: "Revenue Growth Rate Analysis",
  id: "revenue-growth-rate-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description: "Analyze how fast your revenue is increasing over time.",
  description:
    "Revenue Growth Rate Analysis helps track how fast your revenue is increasing over time, which is crucial for assessing business scalability and performance.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "current_period_revenue",
      label: "Current Period Revenue",
      description: "Enter the revenue for the current period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "previous_period_revenue",
      label: "Previous Period Revenue",
      description: "Enter the revenue for the previous period",
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
      { id: "revenue_growth_rate", label: "Revenue Growth Rate (%)" },
      { id: "revenue_increase", label: "Revenue Increase" },
      { id: "previous_period_revenue", label: "Previous Period Revenue" },
    ],
  },
  equation: {
    formula:
      "Revenue Growth Rate = ((Current Period Revenue - Previous Period Revenue) / Previous Period Revenue) × 100",
    variables: {
      "Current Period Revenue": {
        label: "Current Period Revenue",
        description: "Revenue for the current period",
        unit: "currency",
      },
      "Previous Period Revenue": {
        label: "Previous Period Revenue",
        description: "Revenue for the previous period",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const currentRevenue = variables["Current Period Revenue"] ?? 0;
      const previousRevenue = variables["Previous Period Revenue"] ?? 0;

      const revenueIncrease = currentRevenue - previousRevenue;
      const revenueGrowthRate =
        previousRevenue !== 0 ? (revenueIncrease / previousRevenue) * 100 : 0;

      return {
        revenue_growth_rate: revenueGrowthRate,
        revenue_increase: revenueIncrease,
        previous_period_revenue: previousRevenue,
      };
    },
  },
};

export default revenueGrowthRateModelling;
