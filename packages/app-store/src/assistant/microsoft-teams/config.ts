import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const microsoftTeamsConfig: IntegrationConfig = {
  name: "Microsoft Teams",
  id: "microsoft-teams",
  category: IntegrationCategory.Assistant,
  active: false,
  logo: Logo,
  short_description: "Enhance collaboration with Microsoft Teams integration.",
  description: "Microsoft Teams integration allows seamless communication and file sharing within your organization. It enables real-time chat, video meetings, and integration with other Microsoft 365 tools for improved productivity.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "tenant_id",
      label: "Tenant ID",
      description: "Enter your Microsoft Teams Tenant ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "client_id",
      label: "Client ID",
      description: "Enter your Microsoft Teams Client ID",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "client_secret",
      label: "Client Secret",
      description: "Enter your Microsoft Teams Client Secret",
      type: "text",
      required: true,
      value: "",
    },
    {
      id: "notification_sync",
      label: "Sync Notifications",
      description: "Enable synchronization of notifications with other platforms",
      type: "switch",
      required: false,
      value: false,
    },
  ],
  config: {},
};

export default microsoftTeamsConfig;