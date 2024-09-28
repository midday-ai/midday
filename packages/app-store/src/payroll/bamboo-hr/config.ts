import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const bambooHRConfig: IntegrationConfig = {
    name: "BambooHR",
    id: "bamboohr",
    category: IntegrationCategory.Payroll,
    active: false,
    logo: Logo,
    short_description: "Simplify HR management with BambooHR integration.",
    description: "BambooHR integration offers comprehensive HR management solutions, including payroll processing, employee data management, time tracking, and performance management. It streamlines HR workflows and provides valuable insights for better decision-making.",
    images: [],
    onInitialize: initialize,
    settings: [
        {
            id: "api_key",
            label: "API Key",
            description: "Enter your BambooHR API Key",
            type: "text",
            required: true,
            value: "",
        },
        {
            id: "subdomain",
            label: "Subdomain",
            description: "Enter your BambooHR subdomain (e.g., 'companyname' if your URL is 'companyname.bamboohr.com')",
            type: "text",
            required: true,
            value: "",
        },
        {
            id: "sync_interval",
            label: "Sync Interval (hours)",
            description: "Set the interval for automatic data synchronization (in hours)",
            type: "number",
            required: false,
            value: 24,
        },
    ],
    config: {},
};

export default bambooHRConfig;