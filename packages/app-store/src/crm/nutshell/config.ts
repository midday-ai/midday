import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const nutshellApp: IntegrationConfig = {
  name: "Nutshell",
  id: "nutshell",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Simple, smart CRM for small businesses",
  description:
    "Nutshell is a user-friendly CRM and sales automation tool designed to help small businesses close more deals.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default nutshellApp;
