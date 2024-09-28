import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const dynamics365FOConfig: IntegrationConfig = {
  name: "Dynamics 365 Finance & Operations",
  id: "dynamics-365-fo",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Enterprise-grade financial management with Dynamics 365 F&O.",
  description: "Dynamics 365 Finance & Operations integration provides powerful tools for financial management, supply chain management, and business intelligence. It's designed to help large enterprises optimize their operations and make data-driven decisions.",
  images: [],
  onInitialize: () => { },
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Dynamics 365 F&O API key",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "auto_sync",
      label: "Automatic Sync",
      description: "Enable automatic synchronization of data",
      type: "switch",
      required: false,
      value: false,
    },
  ],
  config: {},
};

export default dynamics365FOConfig;