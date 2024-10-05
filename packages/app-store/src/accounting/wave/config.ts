import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const waveConfig: IntegrationConfig = {
  name: "Wave",
  id: "wave",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description:
    "Free and user-friendly accounting software for small businesses.",
  description:
    "Wave integration offers free, easy-to-use accounting software designed for entrepreneurs, freelancers, and small businesses. It provides essential features like invoicing, accounting, and receipt scanning to help you manage your finances effortlessly.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Wave API key",
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

export default waveConfig;
