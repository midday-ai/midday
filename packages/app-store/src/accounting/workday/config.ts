import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const workdayConfig: IntegrationConfig = {
  name: "Workday",
  id: "workday",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description:
    "Comprehensive enterprise cloud solutions for finance and HR.",
  description:
    "Workday integration offers a unified platform for financial management, human capital management, and analytics. It provides real-time insights and helps organizations streamline their finance and HR processes for improved efficiency and decision-making.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Workday API key",
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

export default workdayConfig;
