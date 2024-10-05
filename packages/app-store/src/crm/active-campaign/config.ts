import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const activeCampaignApp: IntegrationConfig = {
  name: "ActiveCampaign",
  id: "active-campaign",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Customer experience automation platform",
  description:
    "ActiveCampaign is a cloud-based platform that combines email marketing, marketing automation, sales automation, and CRM features.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default activeCampaignApp;
