import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const pipedriveApp: IntegrationConfig = {
  name: "Pipedrive",
  id: "pipedrive",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Sales CRM for small teams",
  description:
    "Pipedrive is a sales management tool designed to help small teams manage intricate or lengthy sales processes.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default pipedriveApp;
