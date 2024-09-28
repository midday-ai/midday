import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const clearBooksConfig: IntegrationConfig = {
  name: "ClearBooks",
  id: "clear-books",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Streamline your accounting processes with ClearBooks integration.",
  description: "ClearBooks integration automates your financial data synchronization, reducing manual entry and improving accuracy. It helps in efficient account reconciliation and provides a clear overview of your financial status.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your ClearBooks API key",
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

export default clearBooksConfig;