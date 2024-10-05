import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const gustoConfig: IntegrationConfig = {
  name: "Gusto",
  id: "gusto",
  category: IntegrationCategory.Payroll,
  active: false,
  logo: Logo,
  short_description:
    "Simplify payroll and HR management with Gusto integration.",
  description:
    "Gusto integration offers comprehensive payroll, benefits, and HR management solutions for small to medium-sized businesses. It streamlines payroll processing, tax filings, employee onboarding, and benefits administration, ensuring compliance and efficiency.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_token",
      label: "API Token",
      description: "Enter your Gusto API Token",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "company_id",
      label: "Company ID",
      description: "Enter your Gusto Company ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "sync_interval",
      label: "Sync Interval (hours)",
      description:
        "Set the interval for automatic data synchronization (in hours)",
      type: "number",
      required: false,
      value: 24,
    },
  ],
  config: {},
};

export default gustoConfig;
