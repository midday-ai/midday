import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const pipelinerApp: IntegrationConfig = {
  name: "Pipeliner",
  id: "pipeliner",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Visual CRM for sales teams",
  description:
    "Pipeliner CRM is a visual and intuitive customer relationship management software for sales teams.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default pipelinerApp;
