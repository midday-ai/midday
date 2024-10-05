import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const zohoCrmApp: IntegrationConfig = {
  name: "Zoho CRM",
  id: "zoho-crm",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "CRM to convert more leads",
  description:
    "Zoho CRM is a cloud-based customer relationship management platform that caters to businesses of all sizes.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default zohoCrmApp;
