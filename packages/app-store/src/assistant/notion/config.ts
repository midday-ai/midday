import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const notionConfig: IntegrationConfig = {
  name: "Notion",
  id: "notion",
  category: IntegrationCategory.Assistant,
  active: false,
  logo: Logo,
  short_description: "Enhance productivity with Notion integration.",
  description:
    "Notion integration allows seamless connection to your workspace. It enables easy access to your notes, databases, and wikis, improving organization and collaboration within your team.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "integration_token",
      label: "Integration Token",
      description: "Enter your Notion Integration Token",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "workspace_id",
      label: "Workspace ID",
      description: "Enter your Notion Workspace ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "sync_interval",
      label: "Sync Interval (minutes)",
      description: "Set the interval for syncing data with Notion",
      type: "number",
      required: false,
      value: 30,
    },
    {
      id: "auto_sync",
      label: "Auto Sync",
      description: "Enable automatic synchronization with Notion",
      type: "switch",
      required: false,
      value: true,
    },
  ],
  config: {},
};

export default notionConfig;
