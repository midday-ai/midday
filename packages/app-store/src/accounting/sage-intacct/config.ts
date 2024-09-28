import { Logo } from "./assets/logo";
import { IntegrationConfig, IntegrationCategory } from "../../types";
import { initialize } from "./initialize";

const sageIntacctConfig: IntegrationConfig = {
  name: "Sage Intacct",
  id: "sage-intacct",
  category: IntegrationCategory.Accounting,
  active: false,
  logo: Logo,
  short_description: "Advanced cloud financial management with Sage Intacct.",
  description: "Sage Intacct integration provides sophisticated cloud-based financial management solutions. It offers advanced functionality for accounting, reporting, and analytics, helping businesses streamline operations and gain real-time insights into their financial performance.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your Sage Intacct API key",
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

export default sageIntacctConfig;