import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const salesforceApp: IntegrationConfig = {
  name: "Salesforce",
  id: "salesforce",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "World's #1 CRM platform",
  description:
    "Salesforce is a cloud-based CRM designed to help businesses find more prospects, close more deals, and provide better customer service.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default salesforceApp;
