import { IntegrationCategory, IntegrationConfig, Settings } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const settings: Settings[] = [
  {
    id: "shop_name",
    label: "Shopify Store Name",
    description: "Enter your Shopify store name (e.g., mystore.myshopify.com)",
    type: "text",
    required: true,
    value: "",
  },
  {
    id: "api_key",
    label: "API Key",
    description: "Enter your Shopify API Key",
    type: "text",
    required: true,
    value: "",
  },
  {
    id: "api_secret_key",
    label: "API Secret Key",
    description: "Enter your Shopify API Secret Key",
    type: "text",
    required: true,
    value: "",
  },
  {
    id: "access_token",
    label: "Access Token",
    description: "Enter your Shopify Access Token",
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
];

const shopifyConfig: IntegrationConfig = {
  name: "Shopify",
  id: "shopify",
  category: IntegrationCategory.Banking,
  active: false,
  logo: Logo,
  short_description:
    "Integrate your Shopify store for seamless financial management.",
  description:
    "Enhance your e-commerce operations with our Shopify integration. Automatically sync your sales, refunds, and payout data. Get real-time insights into your store's performance, simplify accounting processes, and make informed financial decisions. Perfect for Shopify merchants looking to streamline their financial workflows and gain a comprehensive view of their online business.",
  images: [],
  onInitialize: initialize,
  settings,
  config: {
    apiVersion: "2023-07",
    sandboxMode: false,
    scopes: [
      "read_orders",
      "read_products",
      "read_customers",
      "read_financial",
    ],
  },
};

export default shopifyConfig;
