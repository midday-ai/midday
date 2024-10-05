import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const quickBooksConfig: IntegrationConfig = {
  name: "QuickBooks",
  id: "quick-books",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description:
    "Powerful accounting software for small and medium-sized businesses.",
  description:
    "QuickBooks integration provides comprehensive accounting tools, including invoicing, expense tracking, financial reporting, and tax preparation. It helps businesses manage their finances efficiently and make informed decisions.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your QuickBooks API key",
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

export default quickBooksConfig;
