import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const sageConfig: IntegrationConfig = {
  name: "Sage",
  id: "sage",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description:
    "Comprehensive accounting solutions with Sage integration.",
  description:
    "Sage integration offers a range of accounting and business management solutions for businesses of all sizes. From basic bookkeeping to advanced financial management, Sage helps you stay in control of your finances and make informed decisions.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Sage API key",
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

export default sageConfig;
