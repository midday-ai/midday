import { IntegrationCategory, IntegrationConfig, Settings } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const settings: Settings[] = [
  {
    id: "api_key",
    label: "API Key",
    description: "Enter your Venmo API key",
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

const venmoConfig: IntegrationConfig = {
  name: "Venmo",
  id: "venmo",
  category: IntegrationCategory.Banking,
  active: false,
  logo: Logo,
  short_description: "Supercharge your financial operations with seamless Venmo integration.",
  description: "Elevate your business with Venmo integration. Automate payment processing, gain real-time financial insights, and streamline reconciliation. This powerful tool reduces manual data entry, minimizes errors, and provides a comprehensive view of your revenue streams. Perfect for businesses of all sizes looking to optimize their financial workflows and make data-driven decisions.",
  images: [],
  onInitialize: initialize,
  settings,
  config: {},
};

export default venmoConfig;