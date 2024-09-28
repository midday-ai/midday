import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const stripeConfig: IntegrationConfig = {
  name: "Stripe",
  id: "stripe",
  category: IntegrationCategory.Banking,
  active: false,
  logo: Logo,
  short_description: "Supercharge your financial operations with seamless Stripe integration.",
  description: "Elevate your business with Stripe integration. Automate payment processing, gain real-time financial insights, and streamline reconciliation. This powerful tool reduces manual data entry, minimizes errors, and provides a comprehensive view of your revenue streams. Perfect for businesses of all sizes looking to optimize their financial workflows and make data-driven decisions.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Stripe API key",
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

export default stripeConfig;