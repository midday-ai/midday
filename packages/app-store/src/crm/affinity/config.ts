import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const affinityApp: IntegrationConfig = {
  name: "Affinity",
  id: "affinity",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Relationship intelligence platform",
  description:
    "Affinity is a relationship intelligence platform that helps teams manage and leverage their network to close deals faster.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default affinityApp;
