import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const capsuleApp: IntegrationConfig = {
  name: "Capsule",
  id: "capsule",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Simple, powerful CRM",
  description:
    "Capsule is a simple, powerful CRM that helps businesses stay organized and build strong customer relationships.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default capsuleApp;
