import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const debtCoverageRatioExpenseModelling: IntegrationConfig = {
  name: "Debt Coverage Ratio Analysis",
  id: "debt-coverage-ratio-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description:
    "Analyze your ability to cover debt obligations with operating income.",
  description:
    "Debt Coverage Ratio Analysis helps assess if your income is sufficient to cover your debt obligations. It calculates the ratio of Net Operating Income to Total Debt Service, providing insights into your financial health and ability to meet debt payments.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "net_operating_income",
      label: "Net Operating Income",
      description: "Enter your net operating income",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "principal_payment",
      label: "Principal Payment",
      description: "Enter your total principal payment",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "interest_payment",
      label: "Interest Payment",
      description: "Enter your total interest payment",
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
      { id: "debt_coverage_ratio", label: "Debt Coverage Ratio" },
      { id: "total_debt_service", label: "Total Debt Service" },
      { id: "net_operating_income", label: "Net Operating Income" },
    ],
  },
  equation: {
    formula:
      "Debt Coverage Ratio = Net Operating Income / Total Debt Service (Principal + Interest)",
    variables: {
      "Net Operating Income": {
        label: "Net Operating Income",
        description: "Income after operating expenses but before debt service",
        unit: "currency",
      },
      "Principal Payment": {
        label: "Principal Payment",
        description: "Total principal payment on debt",
        unit: "currency",
      },
      "Interest Payment": {
        label: "Interest Payment",
        description: "Total interest payment on debt",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const netOperatingIncome = variables["Net Operating Income"] ?? 0;
      const principalPayment = variables["Principal Payment"] ?? 0;
      const interestPayment = variables["Interest Payment"] ?? 0;

      const totalDebtService = principalPayment + interestPayment;
      const debtCoverageRatio =
        totalDebtService !== 0 ? netOperatingIncome / totalDebtService : 0;

      return {
        debt_coverage_ratio: debtCoverageRatio,
        total_debt_service: totalDebtService,
        net_operating_income: netOperatingIncome,
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

export default debtCoverageRatioExpenseModelling;
