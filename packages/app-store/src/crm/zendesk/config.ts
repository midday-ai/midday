import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const zendeskApp: IntegrationConfig = {
  name: "Zendesk Sell",
  id: "zendesk-sell",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Sales CRM for customer-centric teams",
  description:
    "Zendesk Sell (formerly Base CRM) is a sales CRM that helps you close more deals with less effort.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default zendeskApp;
