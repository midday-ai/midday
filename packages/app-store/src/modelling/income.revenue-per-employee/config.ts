import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const revenuePerEmployeeModelling: IntegrationConfig = {
  name: "Revenue Per Employee Analysis",
  id: "revenue-per-employee-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze workforce efficiency and labor impact on revenue generation.",
  description:
    "Revenue Per Employee Analysis helps measure workforce efficiency and the impact of labor on revenue generation. It provides insights into how effectively your company is utilizing its human resources to generate revenue.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "total_revenue",
      label: "Total Revenue",
      description: "Enter your total revenue for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "number_of_employees",
      label: "Number of Employees",
      description: "Enter the total number of employees",
      type: "number",
      required: true,
      value: 1,
      min: 1,
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
      { id: "revenue_per_employee", label: "Revenue Per Employee" },
      { id: "total_revenue", label: "Total Revenue" },
      { id: "number_of_employees", label: "Number of Employees" },
    ],
  },
  equation: {
    formula: "Revenue Per Employee = Total Revenue / Number of Employees",
    variables: {
      "Total Revenue": {
        label: "Total Revenue",
        description: "Total revenue for the period",
        unit: "currency",
      },
      "Number of Employees": {
        label: "Number of Employees",
        description: "Total number of employees",
        unit: "employees",
      },
    },
    calculate: (variables) => {
      const totalRevenue = variables["Total Revenue"] ?? 0;
      const numberOfEmployees = variables["Number of Employees"] ?? 1;

      const revenuePerEmployee =
        numberOfEmployees !== 0 ? totalRevenue / numberOfEmployees : 0;

      return {
        revenue_per_employee: revenuePerEmployee,
        total_revenue: totalRevenue,
        number_of_employees: numberOfEmployees,
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

export default revenuePerEmployeeModelling;
