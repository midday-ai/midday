import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const ebayConfig: IntegrationConfig = {
  name: "eBay",
  id: "ebay",
  category: IntegrationCategory.Banking,
  active: false,
  logo: Logo,
  short_description: "Streamline your eBay sales and financial management.",
  description: "Optimize your eBay business with seamless integration. Automate order processing, track sales, and simplify financial reporting. Reduce manual work, minimize errors, and gain real-time insights into your eBay performance. Ideal for sellers looking to scale their eBay operations and improve financial efficiency.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "client_id",
      label: "Client ID",
      description: "Enter your eBay API Client ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "client_secret",
      label: "Client Secret",
      description: "Enter your eBay API Client Secret",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "refresh_token",
      label: "Refresh Token",
      description: "Enter your eBay API Refresh Token",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "auto_sync",
      label: "Automatic Sync",
      description: "Enable automatic synchronization of eBay data",
      type: "switch",
      required: false,
      value: false,
    },
  ],
  config: {},
};

export default ebayConfig;