import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const xeroConfig: IntegrationConfig = {
  name: "Xero",
  id: "xero",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Beautiful accounting software for small businesses.",
  description:
    "Xero integration provides cloud-based accounting software that's easy to use, yet powerful. It offers features like invoicing, bank reconciliation, inventory tracking, and financial reporting to help small businesses manage their finances effectively.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Xero API key",
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

export default xeroConfig;
