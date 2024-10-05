import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const sageConfig: IntegrationConfig = {
  name: "Sage",
  id: "sage",
  category: IntegrationCategory.Payroll,
  active: false,
  logo: Logo,
  short_description: "Streamline payroll processes with Sage integration.",
  description:
    "Sage integration enables efficient payroll management, automated tax calculations, and seamless reporting. It offers robust features for handling employee data, time tracking, and compliance with local regulations.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Sage API Key",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "company_id",
      label: "Company ID",
      description: "Enter your Sage Company ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "environment",
      label: "Environment",
      description: "Select the Sage environment (Production or Sandbox)",
      type: "select",
      options: ["Sandbox", "Production"],
      required: true,
      value: "sandbox",
    },
    {
      id: "auto_sync",
      label: "Automatic Sync",
      description: "Enable automatic synchronization of payroll data",
      type: "switch",
      required: false,
      value: false,
    },
  ],
  config: {},
};

export default sageConfig;
