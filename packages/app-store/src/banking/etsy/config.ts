import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const etsyConfig: IntegrationConfig = {
  name: "Etsy",
  id: "etsy",
  category: IntegrationCategory.Banking,
  active: false,
  logo: Logo,
  short_description: "Integrate your Etsy shop for seamless financial management.",
  description: "Enhance your Etsy business with our integration. Automatically sync orders, track revenue, and simplify accounting. Get real-time insights into your shop's performance, manage inventory efficiently, and streamline your financial processes. Perfect for Etsy sellers looking to scale their business and improve financial accuracy.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Etsy API key",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "shop_id",
      label: "Shop ID",
      description: "Enter your Etsy Shop ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "auto_sync",
      label: "Automatic Sync",
      description: "Enable automatic synchronization of shop data",
      type: "switch",
      required: false,
      value: false,
    },
  ],
  config: {},
};

export default etsyConfig;