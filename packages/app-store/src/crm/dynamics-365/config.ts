import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";

const dynamics365App: IntegrationConfig = {
  name: "Dynamics 365 Sales",
  id: "dynamics-365-sales",
  category: IntegrationCategory.CRM,
  active: false,
  logo: Logo,
  short_description: "Microsoft's enterprise CRM solution",
  description:
    "Dynamics 365 Sales is Microsoft's enterprise CRM solution that helps organizations build strong customer relationships.",
  images: [],
  onInitialize: () => {
    // Initialization logic
  },
  settings: [],
  config: {},
};

export default dynamics365App;
