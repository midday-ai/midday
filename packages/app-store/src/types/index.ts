import { AppSchema } from "@midday/supabase/types";
import { z } from "zod";

export enum ModelType {
  Regression = "regression",
  TimeSeries = "time_series",
  MonteCarlo = "monte_carlo",
  MachineLearning = "machine_learning",
  FinancialModel = "financial_model",
  Factor = "factor_model",
}

export enum IntegrationType {
  // Retail Businesses
  InventoryForecasting = "inventory_forecasting",
  InventoryFinancing = "inventory_financing",
  RealTimeInventoryValuation = "real_time_inventory_valuation",
  SalesPrediction = "sales_prediction",
  RetailAnalyticsDashboard = "retail_analytics_dashboard",
  CompetitiveBenchmarking = "competitive_benchmarking",
  SeasonalCashFlowForecasting = "seasonal_cash_flow_forecasting",
  DynamicBudgeting = "dynamic_budgeting",
  SeasonalWorkingCapital = "seasonal_working_capital",

  // Professional Services
  AIAssistedTimeTracking = "ai_assisted_time_tracking",
  ProjectManagementIntegration = "project_management_integration",
  ProductivityAnalytics = "productivity_analytics",
  AutomatedInvoicing = "automated_invoicing",
  SmartPaymentReminders = "smart_payment_reminders",
  DynamicPricing = "dynamic_pricing",
  ClientDatabase = "client_database",
  ClientRetentionPrediction = "client_retention_prediction",
  RelationshipHealthScoring = "relationship_health_scoring",

  // Manufacturing SMEs
  SupplyChainVisibility = "supply_chain_visibility",
  SupplierRiskAssessment = "supplier_risk_assessment",
  ProductionCostBreakdown = "production_cost_breakdown",
  CostFluctuationPrediction = "cost_fluctuation_prediction",
  ProductionOptimization = "production_optimization",

  // Hospitality and Food Services
  AIScheduling = "ai_scheduling",
  RealTimePayroll = "real_time_payroll",
  LaborComplianceCheck = "labor_compliance_check",
  TipDistribution = "tip_distribution",
  TipReporting = "tip_reporting",
  TipFraudDetection = "tip_fraud_detection",
  ReservationForecasting = "reservation_forecasting",
  DynamicPricingHospitality = "dynamic_pricing_hospitality",
  InventoryStaffingOptimization = "inventory_staffing_optimization",

  // General (applicable across industries)
  CustomIntegration = "custom_integration",
  DataVisualization = "data_visualization",
  PredictiveAnalytics = "predictive_analytics",
  APIConnector = "api_connector",
  FileImport = "file_import",
  CloudServices = "cloud_services",
  MachineLearning = "machine_learning",

  // Existing types
  Modelling = "modelling",
  GoalTemplates = "goal_templates",
}

// export const AppSchema = z.object({
//   id: z.string().uuid(),
//   app_id: z.string(),
//   config: z.record(z.unknown()).nullable(),
//   created_at: z.string().datetime(),
//   created_by: z.string().uuid().nullable(),
//   settings: z.record(z.unknown()).nullable(),
//   team_id: z.string().uuid().nullable(),
//   equation: z.record(z.unknown()).nullable(),
//   version: z.string().nullable(),
//   last_updated: z.string().datetime(),
//   category: z.string().nullable(),
//   model_type: z.nativeEnum(ModelType).nullable(),
//   input_schema: z.record(z.unknown()).nullable(),
//   output_schema: z.record(z.unknown()).nullable(),
//   dependencies: z.record(z.unknown()).nullable(),
//   is_public: z.boolean().default(false),
//   tags: z.array(z.string()).nullable(),
//   integration_type: z.nativeEnum(IntegrationType).nullable(),
//   integration_config: z.record(z.unknown()).nullable(),
//   auth_method: z
//     .enum(["oauth", "api_key", "username_password", "none"])
//     .nullable(),
//   webhook_url: z.string().url().nullable(),
//   api_version: z.string().nullable(),
//   supported_features: z.array(z.string()).nullable(),
//   data_sync_frequency: z
//     .enum(["realtime", "daily", "weekly", "monthly", "manual"])
//     .nullable(),
//   last_sync_at: z.string().datetime().nullable(),
//   sync_status: z.enum(["active", "paused", "error"]).nullable(),
//   user_permissions: z.record(z.array(z.string())).nullable(),
//   custom_fields: z
//     .array(
//       z.object({
//         name: z.string(),
//         type: z.enum(["string", "number", "boolean", "date"]),
//         value: z.unknown(),
//       })
//     )
//     .nullable(),
//   installed_at: z.string().datetime().nullable(),
// });

// export type App = z.infer<typeof AppSchema>;

// export const CreateAppSchema = AppSchema.omit({
//   id: true,
//   created_at: true,
//   last_updated: true,
// }).partial({
//   config: true,
//   settings: true,
//   equation: true,
//   version: true,
//   category: true,
//   model_type: true,
//   input_schema: true,
//   output_schema: true,
//   dependencies: true,
//   is_public: true,
//   tags: true,
//   integration_type: true,
//   integration_config: true,
//   auth_method: true,
//   webhook_url: true,
//   api_version: true,
//   supported_features: true,
//   data_sync_frequency: true,
//   last_sync_at: true,
//   sync_status: true,
//   user_permissions: true,
//   custom_fields: true,
// });

// export type CreateApp = z.infer<typeof CreateAppSchema>;

// export const UpdateAppSchema = CreateAppSchema.partial();

// export type UpdateApp = z.infer<typeof UpdateAppSchema>;

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
  /** Minimum value for number type */
  min?: number;
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
  Notification = "notification",
  Modelling = "modelling",
  GoalTemplates = "goal templates",
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
  onInitialize: (callback?: () => void) => void;
  /** Array of settings for the integration */
  settings: Array<Settings>;
  /** Object containing additional configuration options for the integration */
  config?: Record<string, unknown>;
  /** Equation configuration for modelling integrations */
  equation?: EquationConfig;
  /** Input schema for the integration */
  input_schema?: Record<string, unknown>;
  /** Output schema for the integration */
  output_schema?: Record<string, unknown>;
  /** Dependencies for the integration */
  dependencies?: Record<string, unknown>;
  /** Performance metrics for the integration */
  performance_metrics?: Record<string, unknown>;
  /** User permissions for the integration */
  user_permissions?: Record<string, string[]>;
  /** Custom fields for the integration */
  custom_fields?: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "date";
    value: unknown;
  }>;
  model_type?: ModelType;
  is_public?: boolean;
  tags?: string[];
  integration_type?: IntegrationType;
  webhook_url?: string;
  api_version?: string;
  supported_features?: string[];
  last_sync_at?: string;
  sync_status?: "active" | "paused" | "error";
  auth_method?: "oauth" | "api_key" | "username_password" | "none";
};

export interface EquationVariable {
  label: string;
  description: string;
  unit?: string;
}

export interface EquationConfig {
  formula: string;
  variables: {
    [key: string]: EquationVariable;
  };
  calculate: (variables: { [key: string]: number }) => {
    [key: string]: number;
  };
}

// const AccountingIntegrationSchema = AppSchema.extend({
//   chart_of_accounts: z
//     .array(
//       z.object({
//         id: z.string(),
//         name: z.string(),
//         type: z.string(),
//       })
//     )
//     .nullable(),
//   fiscal_year_end: z.string().nullable(),
// });

// const BankingIntegrationSchema = AppSchema.extend({
//   supported_account_types: z.array(z.string()).nullable(),
//   transaction_history_months: z.number().nullable(),
// });

// const CRMIntegrationSchema = AppSchema.extend({
//   contact_fields: z.array(z.string()).nullable(),
//   deal_stages: z.array(z.string()).nullable(),
// });

// export type AccountingIntegration = z.infer<typeof AccountingIntegrationSchema>;
// export type BankingIntegration = z.infer<typeof BankingIntegrationSchema>;
// export type CRMIntegration = z.infer<typeof CRMIntegrationSchema>;

export interface IntegrationMethods {
  initialize: () => Promise<void>;
  sync: () => Promise<void>;
  disconnect: () => Promise<void>;
  getStatus: () => Promise<{ status: string; message?: string }>;
}

export type AppWithMethods = AppSchema & IntegrationMethods;

// export function createIntegrationApp(
//   baseApp: App,
//   integrationType: IntegrationType
// ): AppWithMethods {
//   const commonMethods: IntegrationMethods = {
//     initialize: async () => {
//       // Common initialization logic
//     },
//     sync: async () => {
//       // Common sync logic
//     },
//     disconnect: async () => {
//       // Common disconnect logic
//     },
//     getStatus: async () => {
//       // Common status check logic
//       return { status: "active" };
//     },
//   };

//   switch (integrationType) {
//     case IntegrationType.Accounting:
//       return {
//         ...baseApp,
//         ...commonMethods,
//         // Add accounting-specific methods
//       };
//     case IntegrationType.Banking:
//       return {
//         ...baseApp,
//         ...commonMethods,
//         // Add banking-specific methods
//       };
//     // ... other cases ...
//     default:
//       return {
//         ...baseApp,
//         ...commonMethods,
//       };
//   }
// }

export { IntegrationCategory };
export type { IntegrationConfig, Settings };
