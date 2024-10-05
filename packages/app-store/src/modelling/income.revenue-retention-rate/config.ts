import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const revenueRetentionRateModelling: ModellingIntegrationConfig = {
  name: "Revenue Retention Rate Analysis",
  id: "revenue-retention-rate-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze how well your business retains revenue from existing customers.",
  description:
    "Revenue Retention Rate Analysis helps assess how well a business retains revenue from existing customers. It's crucial for subscription-based models and provides insights into customer loyalty and the effectiveness of retention strategies.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "revenue_end_period",
      label: "Revenue at End of Period",
      description: "Enter your total revenue at the end of the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "revenue_new_customers",
      label: "Revenue from New Customers",
      description:
        "Enter the revenue generated from new customers during the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "revenue_start_period",
      label: "Revenue at Start of Period",
      description: "Enter your total revenue at the start of the period",
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
      { id: "revenue_retention_rate", label: "Revenue Retention Rate (%)" },
      { id: "retained_revenue", label: "Retained Revenue" },
      { id: "revenue_start_period", label: "Revenue at Start of Period" },
    ],
  },
  equation: {
    formula:
      "Revenue Retention = ((Revenue at End of Period - Revenue from New Customers) / Revenue at Start of Period) × 100",
    variables: {
      "Revenue at End of Period": {
        label: "Revenue at End of Period",
        description: "Total revenue at the end of the period",
        unit: "currency",
      },
      "Revenue from New Customers": {
        label: "Revenue from New Customers",
        description: "Revenue generated from new customers during the period",
        unit: "currency",
      },
      "Revenue at Start of Period": {
        label: "Revenue at Start of Period",
        description: "Total revenue at the start of the period",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const revenueEndPeriod = variables["Revenue at End of Period"] ?? 0;
      const revenueNewCustomers = variables["Revenue from New Customers"] ?? 0;
      const revenueStartPeriod = variables["Revenue at Start of Period"] ?? 0;

      const retainedRevenue = revenueEndPeriod - revenueNewCustomers;
      const revenueRetentionRate =
        revenueStartPeriod !== 0
          ? (retainedRevenue / revenueStartPeriod) * 100
          : 0;

      return {
        revenue_retention_rate: revenueRetentionRate,
        retained_revenue: retainedRevenue,
        revenue_start_period: revenueStartPeriod,
      };
    },
  },
};

export default revenueRetentionRateModelling;
