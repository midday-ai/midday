import { IntegrationCategory, ModellingIntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const operatingLeverageExpenseModelling: ModellingIntegrationConfig = {
  name: "Operating Leverage Analysis",
  id: "operating-leverage-analysis",
  category: IntegrationCategory.Modelling,
  active: true,
  logo: Logo,
  short_description: "Analyze the impact of fixed costs on operating income.",
  description:
    "Operating Leverage Analysis measures how sensitive your operating income is to changes in sales volume, showing the risk of fixed costs. It helps assess the potential impact of changes in sales on your profitability.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "contribution_margin",
      label: "Contribution Margin",
      description: "Enter your total contribution margin",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "net_operating_income",
      label: "Net Operating Income",
      description: "Enter your net operating income",
      type: "number",
      required: true,
      value: 0,
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
      { id: "operating_leverage", label: "Operating Leverage" },
      { id: "contribution_margin", label: "Contribution Margin" },
      { id: "net_operating_income", label: "Net Operating Income" },
    ],
  },
  equation: {
    formula: "Operating Leverage = Contribution Margin / Net Operating Income",
    variables: {
      "Contribution Margin": {
        label: "Contribution Margin",
        description: "Total revenue minus total variable costs",
        unit: "currency",
      },
      "Net Operating Income": {
        label: "Net Operating Income",
        description: "Earnings before interest and taxes (EBIT)",
        unit: "currency",
      },
    },
    calculate: (variables) => {
      const contributionMargin = variables["Contribution Margin"] ?? 0;
      const netOperatingIncome = variables["Net Operating Income"] ?? 0;

      const operatingLeverage =
        netOperatingIncome !== 0 ? contributionMargin / netOperatingIncome : 0;

      return {
        operating_leverage: operatingLeverage,
        contribution_margin: contributionMargin,
        net_operating_income: netOperatingIncome,
      };
    },
  },
};

export default operatingLeverageExpenseModelling;
