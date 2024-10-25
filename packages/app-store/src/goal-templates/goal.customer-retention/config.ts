import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const customerRetentionGoalTemplate: IntegrationConfig = {
  name: "Customer Retention Goal Template",
  id: "customer-retention-goal-template",
  category: IntegrationCategory.GoalTemplates,
  active: true,
  logo: Logo,
  short_description:
    "Set and track customer retention goals for your business.",
  description:
    "This Customer Retention Goal Template helps you define, track, and achieve objectives related to maintaining and improving customer loyalty. It considers metrics such as customer churn rate, customer lifetime value, and repeat purchase rate.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "current_customers",
      label: "Current Number of Customers",
      description: "Enter the current number of active customers",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_retention_rate",
      label: "Target Retention Rate (%)",
      description: "Enter your target customer retention rate",
      type: "number",
      required: true,
      value: 90,
      min: 0,
    },
    {
      id: "average_purchase_value",
      label: "Average Purchase Value",
      description: "Enter the average purchase value per customer",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "timeline",
      label: "Timeline",
      description: "Select the timeline for achieving this goal",
      type: "select",
      required: true,
      value: "annually",
      options: ["quarterly", "annually", "custom"],
    },
    {
      id: "custom_timeline",
      label: "Custom Timeline (in days)",
      description:
        "If you selected 'custom' timeline, enter the number of days",
      type: "number",
      required: false,
      value: 365,
      min: 1,
    },
  ],
  config: {
    resultFields: [
      { id: "customers_to_retain", label: "Customers to Retain" },
      { id: "projected_churn_rate", label: "Projected Churn Rate (%)" },
      { id: "customer_lifetime_value", label: "Customer Lifetime Value" },
      { id: "retention_revenue", label: "Projected Retention Revenue" },
    ],
  },
  equation: {
    formula:
      "Customers to Retain = Current Customers * (Target Retention Rate / 100)",
    variables: {
      "Current Customers": {
        label: "Current Customers",
        description: "The current number of active customers",
        unit: "customers",
      },
      "Target Retention Rate": {
        label: "Target Retention Rate",
        description: "Your target customer retention rate",
        unit: "percentage",
      },
      "Average Purchase Value": {
        label: "Average Purchase Value",
        description: "The average purchase value per customer",
        unit: "currency",
      },
    },
    calculate: (variables: Record<string, number | string>) => {
      const currentCustomers = Number(variables["Current Customers"]) || 0;
      const targetRetentionRate =
        Number(variables["Target Retention Rate"]) || 90;
      const averagePurchaseValue =
        Number(variables["Average Purchase Value"]) || 0;
      const timeline = (variables["Timeline"] as string) || "annually";
      const customTimeline =
        Number(variables["Custom Timeline (in days)"]) || 365;

      const customersToRetain = Math.round(
        currentCustomers * (targetRetentionRate / 100),
      );
      const projectedChurnRate = 100 - targetRetentionRate;

      let timelineInYears;
      switch (timeline) {
        case "quarterly":
          timelineInYears = 0.25;
          break;
        case "annually":
          timelineInYears = 1;
          break;
        case "custom":
          timelineInYears = customTimeline / 365;
          break;
        default:
          timelineInYears = 1;
      }

      const customerLifetimeValue =
        averagePurchaseValue *
        (1 / (projectedChurnRate / 100)) *
        timelineInYears;
      const retentionRevenue =
        customersToRetain * averagePurchaseValue * timelineInYears;

      return {
        customers_to_retain: customersToRetain,
        projected_churn_rate: projectedChurnRate,
        customer_lifetime_value: customerLifetimeValue,
        retention_revenue: retentionRevenue,
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

export default customerRetentionGoalTemplate;
