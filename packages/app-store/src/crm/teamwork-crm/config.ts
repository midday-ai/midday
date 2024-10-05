import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const teamworkCrmApp: IntegrationConfig = {
  name: "Teamwork CRM",
  id: "teamwork-crm",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "CRM for client-focused businesses",
  description:
    "Teamwork CRM is a full-featured CRM system designed for client-focused businesses to manage leads, deals, and customers.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default teamworkCrmApp;
