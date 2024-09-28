import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const oracleNetSuiteConfig: IntegrationConfig = {
  name: "Oracle NetSuite",
  id: "oracle-netsuite",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Comprehensive cloud-based business management with NetSuite.",
  description: "Oracle NetSuite integration provides a unified cloud-based solution for ERP, financials, CRM, and e-commerce. It offers real-time visibility and control over your business operations, helping you make informed decisions and drive growth.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Oracle NetSuite API key",
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

export default oracleNetSuiteConfig;