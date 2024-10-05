import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const zohoConfig: IntegrationConfig = {
  name: "Zoho",
  id: "zoho",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description:
    "Comprehensive suite of business software including accounting.",
  description:
    "Zoho integration offers a wide range of business applications, including accounting software. It provides features for invoicing, expense tracking, inventory management, and financial reporting, helping businesses streamline their financial processes and gain insights into their performance.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Zoho API key",
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

export default zohoConfig;
