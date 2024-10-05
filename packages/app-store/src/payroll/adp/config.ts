import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const adpConfig: IntegrationConfig = {
  name: "ADP",
  id: "adp",
  category: IntegrationCategory.Payroll,
  active: false,
  logo: Logo,
  short_description: "Streamline payroll processing with ADP integration.",
  description:
    "ADP integration enables efficient payroll management, tax filing, and HR services. It offers automated payroll processing, compliance support, and seamless integration with your existing systems for improved accuracy and time savings.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "client_id",
      label: "Client ID",
      description: "Enter your ADP Client ID",
      type: "text",
      required: true,
      value: true,
    },
    {
      id: "client_secret",
      label: "Client Secret",
      description: "Enter your ADP Client Secret",
      type: "text",
      required: true,
      value: true,
    },
    {
      id: "api_key",
      label: "API Key",
      description: "Enter your ADP API Key",
      type: "text",
      required: true,
      value: true,
    },
    {
      id: "auto_sync",
      label: "Automatic Sync",
      description: "Enable automatic synchronization of payroll data",
      type: "switch",
      required: false,
      value: true,
    },
  ],
  config: {},
};

export default adpConfig;
