import { IntegrationCategory, IntegrationConfig } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const paychexConfig: IntegrationConfig = {
    name: "Paychex",
    id: "paychex",
    category: IntegrationCategory.Payroll,
    active: false,
    logo: Logo,
    short_description: "Streamline payroll processing with Paychex integration.",
    description: "Paychex integration allows seamless payroll management, tax filing, and HR services. It enables automated payroll processing, time tracking, and compliance with labor laws for improved efficiency.",
    images: [],
    onInitialize: initialize,
    settings: [
        {
            id: "api_key",
            label: "API Key",
            description: "Enter your Paychex API Key",
            type: "text",
            required: true,
            value: "",
        },
        {
            id: "company_id",
            label: "Company ID",
            description: "Enter your Paychex Company ID",
            type: "text",
            required: true,
            value: "",
        },
        {
            id: "environment",
            label: "Environment",
            description: "Select the Paychex environment (Production or Sandbox)",
            type: "select",
            options: [
                "Production",
                "Sandbox",
            ],
            required: true,
            value: "sandbox",
        },
        {
            id: "auto_sync",
            label: "Automatic Sync",
            description: "Enable automatic synchronization of payroll data",
            type: "switch",
            required: false,
            value: false,
        },
    ],
    config: {},
};

export default paychexConfig;