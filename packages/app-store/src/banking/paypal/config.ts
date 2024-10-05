import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const paypalConfig: IntegrationConfig = {
  name: "PayPal",
  id: "paypal",
  category: IntegrationCategory.Banking,
  active: false,
  logo: Logo,
  short_description:
    "Simplify online payments and financial management with PayPal integration.",
  description:
    "Enhance your business operations with PayPal integration. Process payments securely, track transactions in real-time, and manage your finances effortlessly. Benefit from automated reconciliation, detailed reporting, and seamless fund transfers. Ideal for businesses of all sizes looking to streamline their payment processes and improve cash flow management.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "client_id",
      label: "Client ID",
      description: "Enter your PayPal API Client ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "client_secret",
      label: "Client Secret",
      description: "Enter your PayPal API Client Secret",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "sandbox_mode",
      label: "Sandbox Mode",
      description: "Enable sandbox mode for testing",
      type: "switch",
      required: false,
      value: false,
    },
    {
      id: "auto_sync",
      label: "Automatic Sync",
      description: "Enable automatic synchronization of transaction data",
      type: "switch",
      required: false,
      value: false,
    },
  ],
  config: {},
};

export default paypalConfig;
