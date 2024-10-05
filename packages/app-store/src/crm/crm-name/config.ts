import { CRMIntegrationConfig, IntegrationCategory } from "../../types";
import Logo from "./assets/logo";

const copperApp: CRMIntegrationConfig = {
  name: "Copper",
  id: "copper",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "CRM for G Suite",
  description:
    "Copper is a CRM that integrates seamlessly with G Suite, designed for businesses that use Google for work.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
  auth: {
    // Add authentication details specific to Copper
  },
  endpoints: {
    baseUrl: "https://api.copper.com/developer_api/v1",
    // Add Copper API endpoints
  },
};

export default copperApp;
