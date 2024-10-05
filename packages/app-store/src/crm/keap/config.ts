import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const keapApp: IntegrationConfig = {
  name: "Keap",
  id: "keap",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "CRM and marketing automation for small businesses",
  description:
    "Keap (formerly Infusionsoft) is a CRM and marketing automation platform designed for small businesses.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default keapApp;
