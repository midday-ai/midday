import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const freshBooksConfig: IntegrationConfig = {
  name: "FreshBooks",
  id: "fresh-books",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description:
    "Effortless invoicing and accounting with FreshBooks integration.",
  description:
    "FreshBooks integration simplifies your financial management with easy-to-use invoicing, expense tracking, and time tracking features. It's designed to help small businesses and freelancers streamline their accounting processes.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your FreshBooks API key",
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

export default freshBooksConfig;
