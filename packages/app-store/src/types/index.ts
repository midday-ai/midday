/**
 * Represents a setting for an integration.
 */
type Settings = {
    /** Unique identifier for the setting */
    id: string;
    /** Display label for the setting */
    label: string;
    /** Detailed description of the setting */
    description: string;
    /** The type of input for the setting */
    type: "switch" | "text" | "number" | "select";
    /** Options for select type */
    options?: string[];
    /** Indicates whether the setting is required */
    required: boolean;
    /** The current value of the setting */
    value: unknown;
};

/**
 * Enum representing categories for integrations.
 */
enum IntegrationCategory {
    Assistant = "assistant",
    Accounting = "accounting",
    Payroll = "payroll",
    Banking = "banking",
    CRM = "crm",
    Notification = "notification"
}

/**
 * Represents the configuration for an integration.
 */
type IntegrationConfig = {
    /** The name of the integration */
    name: string;
    /** Unique identifier for the integration */
    id: string;
    /** Category of the integration */
    category: IntegrationCategory;
    /** Indicates whether the integration is currently active */
    active: boolean;
    /** React component for the integration's logo */
    logo: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    /** Brief description of the integration */
    short_description: string;
    /** Detailed description of the integration */
    description: string;
    /** Array of image URLs associated with the integration */
    images: string[];
    /** Function to be called when initializing the integration */
    onInitialize: () => void;
    /** Array of settings for the integration */
    settings: Array<Settings>;
    /** Object containing additional configuration options for the integration */
    config: Record<string, unknown>;
};

export { IntegrationCategory };
export type { IntegrationConfig, Settings };

