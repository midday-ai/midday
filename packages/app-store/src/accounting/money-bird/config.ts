import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const moneyBirdConfig: IntegrationConfig = {
  name: "MoneyBird",
  id: "money-bird",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Simplified bookkeeping with MoneyBird integration.",
  description:
    "MoneyBird integration offers easy-to-use online bookkeeping software for freelancers and small businesses. It simplifies invoicing, expense tracking, and financial reporting to help you stay on top of your finances.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your MoneyBird API key",
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

export default moneyBirdConfig;
