import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const cacLtvRatioModelling: ModellingIntegrationConfig = {
  name: "CAC to LTV Ratio Analysis",
  id: "cac-ltv-ratio-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze customer acquisition cost efficiency relative to lifetime value.",
  description:
    "CAC to LTV Ratio Analysis helps determine if your business is spending too much on acquiring customers compared to the revenue they generate over their lifetime. It's crucial for assessing the efficiency of your marketing and sales efforts.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "customer_acquisition_cost",
      label: "Customer Acquisition Cost (CAC)",
      description: "Enter the average cost to acquire a new customer",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "customer_lifetime_value",
      label: "Customer Lifetime Value (LTV)",
      description: "Enter the average lifetime value of a customer",
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
      { id: "cac_ltv_ratio", label: "CAC to LTV Ratio" },
      { id: "cac", label: "Customer Acquisition Cost" },
      { id: "ltv", label: "Customer Lifetime Value" },
    ],
  },
  equation: {
    formula:
      "CAC to LTV Ratio = Customer Acquisition Cost / Customer Lifetime Value",
    variables: {
      "Customer Acquisition Cost": {
        label: "Customer Acquisition Cost",
        description: "Average cost to acquire a new customer",
        unit: "currency",
      },
      "Customer Lifetime Value": {
        label: "Customer Lifetime Value",
        description: "Average lifetime value of a customer",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const cac = variables["Customer Acquisition Cost"] ?? 0;
      const ltv = variables["Customer Lifetime Value"] ?? 0;

      const cacLtvRatio = ltv !== 0 ? cac / ltv : 0;

      return {
        cac_ltv_ratio: cacLtvRatio,
        cac: cac,
        ltv: ltv,
      };
    },
  },
};

export default cacLtvRatioModelling;
