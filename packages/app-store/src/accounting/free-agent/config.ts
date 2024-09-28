import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const freeAgentConfig: IntegrationConfig = {
  name: "FreeAgent",
  id: "free-agent",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Simplify your accounting with FreeAgent integration.",
  description: "FreeAgent integration streamlines your financial processes, offering easy invoicing, expense tracking, and comprehensive reporting. It helps small businesses and freelancers manage their finances efficiently.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your FreeAgent API key",
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

export default freeAgentConfig;