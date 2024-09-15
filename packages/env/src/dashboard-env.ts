import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Enum for supported authentication providers
 */
const authProviderEnum = z.enum([
  "apple",
  "slack",
  "github",
  "google",
  "magic_link",
  "otp",
  "email",
]);

/**
 * Enum for supported financial providers
 */
const financialProviderEnum = z.enum(["plaid", "teller", "gocardless"]);

/**
 * Enum for analytics modules
 */
const analyticsModulesEnum = z.enum(["merchant", "location", "realtime"]);

/**
 * Enum for smart goal features
 */
const smartGoalFeaturesEnum = z.enum([
  "milestones",
  "forecasts",
  "notes",
  "progress_tracking",
]);

/**
 * Enum for milestone features
 */
const milestoneFeaturesEnum = z.enum([
  "completion_tracking",
  "budget_integration",
]);

/**
 * Enum for forecast features
 */
const forecastFeaturesEnum = z.enum(["revenue", "expenses", "cash_flow"]);

/**
 * Environment configuration using t3-oss/env-nextjs for the dashboard
 * @example
 * // Usage in a dashboard component
 * import { environment, featureFlags } from './dashboard';
 *
 * function DashboardComponent() {
 *   if (featureFlags.isAnalyticsEnabled) {
 *     console.log(`Analytics modules: ${featureFlags.analyticsModules.join(', ')}`);
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <p>Supabase URL: {environment.NEXT_PUBLIC_SUPABASE_URL}</p>
 *       {featureFlags.isDarkModeEnabled && <DarkModeToggle />}
 *     </div>
 *   );
 * }
 */
const booleanParser = (value: unknown) => {
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

export const dashboardEnvironment = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    VERCEL_URL: z
      .string()
      .optional()
      .transform((v) => (v ? `https://${v}` : undefined)),
    PORT: z.coerce.number().default(3000),
  },
  server: {
    API_ROUTE_SECRET: z.string(),
    SUPABASE_SERVICE_KEY: z.string(),
    OPENAI_API_KEY: z.string(),
    GROQ_API_KEY: z.string(),
    RESEND_API_KEY: z.string(),
    PLAIN_API_KEY: z.string(),
    UPSTASH_REDIS_REST_URL: z.string(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
    LOOPS_API_KEY: z.string(),
    LOOPS_ENDPOINT: z.string(),
    GOCARDLESS_SECRET_ID: z.string(),
    GOCARDLESS_SECRET_KEY: z.string(),
    NOVU_API_KEY: z.string(),
    BASELIME_SERVICE: z.string(),
    BASELIME_API_KEY: z.string(),
    OPENPANEL_SECRET_KEY: z.string(),
    GOOGLE_APPLICATION_INVOICE_PROCESSOR_ID: z.string(),
    GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID: z.string(),
    ENABLE_NEW_BACKEND_API: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    ENABLE_CACHING: z.coerce.boolean().default(true),
    MAX_CONCURRENT_REQUESTS: z.coerce.number().default(10),
    ENABLE_RATE_LIMITING: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    USE_LEGACY_DATABASE: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_ID: z.string(),
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER: z.string(),
    NEXT_PUBLIC_TRIGGER_API_KEY: z.string(),
    NEXT_PUBLIC_TELLER_APPLICATION_ID: z.string(),
    NEXT_PUBLIC_TELLER_ENVIRONMENT: z.string(),
    NEXT_PUBLIC_PLAID_ENVIRONMENT: z.string(),
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID: z.string(),
    NEXT_PUBLIC_SOLOMON_AI_BACKEND_PLATFORM_API_URL: z.string(),

    // Feature flags
    NEXT_PUBLIC_ENABLE_AUTH: z.coerce.boolean().default(true),
    NEXT_PUBLIC_AUTH_PROVIDERS: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : val),
        z.array(authProviderEnum),
      )
      .default(["google", "slack", "github", "otp"]),
    NEXT_PUBLIC_FINANCIAL_PROVIDERS: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : val),
        z.array(financialProviderEnum),
      )
      .default(["plaid", "teller", "gocardless"]),
    NEXT_PUBLIC_ENABLE_PRICING: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    NEXT_PUBLIC_ENABLE_SUBSCRIPTION_MANAGEMENT: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    NEXT_PUBLIC_ENABLE_ANALYTICS: z.coerce.boolean().default(true),
    NEXT_PUBLIC_ANALYTICS_MODULES: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : val),
        z.array(analyticsModulesEnum),
      )
      .default(["merchant", "location", "realtime"]),
    NEXT_PUBLIC_ENABLE_DARK_MODE: z.coerce.boolean().default(true),
    NEXT_PUBLIC_ENABLE_CUSTOMIZABLE_DASHBOARD: z.coerce
      .boolean()
      .default(false),
    NEXT_PUBLIC_ENABLE_GUIDED_ONBOARDING: z.coerce.boolean().default(true),
    NEXT_PUBLIC_ENABLE_LAZY_LOADING: z.coerce.boolean().default(true),
    NEXT_PUBLIC_ENABLE_SERVICE_WORKER: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    NEXT_PUBLIC_ENABLE_SMART_GOALS: z.coerce.boolean().default(true),
    NEXT_PUBLIC_SMART_GOAL_FEATURES: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : val),
        z.array(smartGoalFeaturesEnum),
      )
      .default(["milestones", "forecasts", "notes", "progress_tracking"]),
    NEXT_PUBLIC_ENABLE_MILESTONES: z.coerce.boolean().default(true),
    NEXT_PUBLIC_MILESTONE_FEATURES: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : val),
        z.array(milestoneFeaturesEnum),
      )
      .default(["completion_tracking", "budget_integration"]),
    NEXT_PUBLIC_ENABLE_FORECASTS: z.coerce.boolean().default(true),
    NEXT_PUBLIC_FORECAST_FEATURES: z
      .preprocess(
        (val) => (typeof val === "string" ? val.split(",") : val),
        z.array(forecastFeaturesEnum),
      )
      .default(["revenue", "expenses", "cash_flow"]),
    NEXT_PUBLIC_ENABLE_BETA_FEATURES: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    NEXT_PUBLIC_NEW_UI_VERSION: z.string().default("v1"),
    NEXT_PUBLIC_PAYMENTS_ENABLED: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
    NEXT_PUBLIC_ENABLE_ANALYTICS_V2: z
      .preprocess(booleanParser, z.boolean())
      .default(false),
  },
  runtimeEnv: {
    NODE_ENV: process.env["NODE_ENV"],
    VERCEL_URL: process.env["VERCEL_URL"],
    PORT: process.env["PORT"],
    // Map all other environment variables here
    API_ROUTE_SECRET: process.env["API_ROUTE_SECRET"],
    SUPABASE_SERVICE_KEY: process.env["SUPABASE_SERVICE_KEY"],
    OPENAI_API_KEY: process.env["OPENAI_API_KEY"],
    GROQ_API_KEY: process.env["GROQ_API_KEY"],
    RESEND_API_KEY: process.env["RESEND_API_KEY"],
    PLAIN_API_KEY: process.env["PLAIN_API_KEY"],
    UPSTASH_REDIS_REST_URL: process.env["UPSTASH_REDIS_REST_URL"],
    UPSTASH_REDIS_REST_TOKEN: process.env["UPSTASH_REDIS_REST_TOKEN"],
    LOOPS_API_KEY: process.env["LOOPS_API_KEY"],
    LOOPS_ENDPOINT: process.env["LOOPS_ENDPOINT"],
    GOCARDLESS_SECRET_ID: process.env["GOCARDLESS_SECRET_ID"],
    GOCARDLESS_SECRET_KEY: process.env["GOCARDLESS_SECRET_KEY"],
    NOVU_API_KEY: process.env["NOVU_API_KEY"],
    BASELIME_SERVICE: process.env["BASELIME_SERVICE"],
    BASELIME_API_KEY: process.env["BASELIME_API_KEY"],
    OPENPANEL_SECRET_KEY: process.env["OPENPANEL_SECRET_KEY"],
    GOOGLE_APPLICATION_INVOICE_PROCESSOR_ID:
      process.env["GOOGLE_APPLICATION_INVOICE_PROCESSOR_ID"],
    GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID:
      process.env["GOOGLE_APPLICATION_EXPENSE_PROCESSOR_ID"],
    NEXT_PUBLIC_SUPABASE_URL: process.env["NEXT_PUBLIC_SUPABASE_URL"],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    NEXT_PUBLIC_SUPABASE_ID: process.env["NEXT_PUBLIC_SUPABASE_ID"],
    NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER:
      process.env["NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER"],
    NEXT_PUBLIC_TRIGGER_API_KEY: process.env["NEXT_PUBLIC_TRIGGER_API_KEY"],
    NEXT_PUBLIC_TELLER_APPLICATION_ID:
      process.env["NEXT_PUBLIC_TELLER_APPLICATION_ID"],
    NEXT_PUBLIC_TELLER_ENVIRONMENT:
      process.env["NEXT_PUBLIC_TELLER_ENVIRONMENT"],
    NEXT_PUBLIC_PLAID_ENVIRONMENT: process.env["NEXT_PUBLIC_PLAID_ENVIRONMENT"],
    NEXT_PUBLIC_OPENPANEL_CLIENT_ID:
      process.env["NEXT_PUBLIC_OPENPANEL_CLIENT_ID"],
    NEXT_PUBLIC_SOLOMON_AI_BACKEND_PLATFORM_API_URL:
      process.env["NEXT_PUBLIC_SOLOMON_AI_BACKEND_PLATFORM_API_URL"],
    // Map all feature flags here
    NEXT_PUBLIC_ENABLE_AUTH: process.env["NEXT_PUBLIC_ENABLE_AUTH"],
    NEXT_PUBLIC_AUTH_PROVIDERS: process.env["NEXT_PUBLIC_AUTH_PROVIDERS"],
    NEXT_PUBLIC_FINANCIAL_PROVIDERS:
      process.env["NEXT_PUBLIC_FINANCIAL_PROVIDERS"],
    NEXT_PUBLIC_ENABLE_PRICING: process.env["NEXT_PUBLIC_ENABLE_PRICING"],
    NEXT_PUBLIC_ENABLE_SUBSCRIPTION_MANAGEMENT:
      process.env["NEXT_PUBLIC_ENABLE_SUBSCRIPTION_MANAGEMENT"],
    NEXT_PUBLIC_ENABLE_ANALYTICS: process.env["NEXT_PUBLIC_ENABLE_ANALYTICS"],
    NEXT_PUBLIC_ANALYTICS_MODULES: process.env["NEXT_PUBLIC_ANALYTICS_MODULES"],
    NEXT_PUBLIC_ENABLE_DARK_MODE: process.env["NEXT_PUBLIC_ENABLE_DARK_MODE"],
    NEXT_PUBLIC_ENABLE_CUSTOMIZABLE_DASHBOARD:
      process.env["NEXT_PUBLIC_ENABLE_CUSTOMIZABLE_DASHBOARD"],
    NEXT_PUBLIC_ENABLE_GUIDED_ONBOARDING:
      process.env["NEXT_PUBLIC_ENABLE_GUIDED_ONBOARDING"],
    NEXT_PUBLIC_ENABLE_LAZY_LOADING:
      process.env["NEXT_PUBLIC_ENABLE_LAZY_LOADING"],
    NEXT_PUBLIC_ENABLE_SERVICE_WORKER:
      process.env["NEXT_PUBLIC_ENABLE_SERVICE_WORKER"],
    NEXT_PUBLIC_ENABLE_SMART_GOALS:
      process.env["NEXT_PUBLIC_ENABLE_SMART_GOALS"],
    NEXT_PUBLIC_SMART_GOAL_FEATURES:
      process.env["NEXT_PUBLIC_SMART_GOAL_FEATURES"],
    NEXT_PUBLIC_ENABLE_MILESTONES: process.env["NEXT_PUBLIC_ENABLE_MILESTONES"],
    NEXT_PUBLIC_MILESTONE_FEATURES:
      process.env["NEXT_PUBLIC_MILESTONE_FEATURES"],
    NEXT_PUBLIC_ENABLE_FORECASTS: process.env["NEXT_PUBLIC_ENABLE_FORECASTS"],
    NEXT_PUBLIC_FORECAST_FEATURES: process.env["NEXT_PUBLIC_FORECAST_FEATURES"],
    NEXT_PUBLIC_ENABLE_BETA_FEATURES:
      process.env["NEXT_PUBLIC_ENABLE_BETA_FEATURES"],
    NEXT_PUBLIC_NEW_UI_VERSION: process.env["NEXT_PUBLIC_NEW_UI_VERSION"],
    NEXT_PUBLIC_PAYMENTS_ENABLED: process.env["NEXT_PUBLIC_PAYMENTS_ENABLED"],
    ENABLE_NEW_BACKEND_API: process.env["ENABLE_NEW_BACKEND_API"],
    ENABLE_CACHING: process.env["ENABLE_CACHING"],
    MAX_CONCURRENT_REQUESTS: process.env["MAX_CONCURRENT_REQUESTS"],
    ENABLE_RATE_LIMITING: process.env["ENABLE_RATE_LIMITING"],
    NEXT_PUBLIC_ENABLE_ANALYTICS_V2:
      process.env["NEXT_PUBLIC_ENABLE_ANALYTICS_V2"],
    LOG_LEVEL: process.env["LOG_LEVEL"],
    USE_LEGACY_DATABASE: process.env["USE_LEGACY_DATABASE"],
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});

/**
 * Exported environment variables for the dashboard
 */
export const environment = dashboardEnvironment;

/**
 * Feature flags configuration for the dashboard
 * @example
 * // Usage in a dashboard utility function
 * import { featureFlags } from './dashboard';
 *
 * function initializeDashboard() {
 *   if (featureFlags.isSmartGoalsEnabled) {
 *     console.log(`Smart Goals features: ${featureFlags.smartGoalFeatures.join(', ')}`);
 *     // Initialize smart goals functionality
 *   }
 *
 *   if (featureFlags.isCustomizableDashboardEnabled) {
 *     // Set up customizable dashboard layout
 *   }
 * }
 */
export const featureFlags = {
  isAuthEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_AUTH,
  authProviders: dashboardEnvironment.NEXT_PUBLIC_AUTH_PROVIDERS,
  financialProviders: dashboardEnvironment.NEXT_PUBLIC_FINANCIAL_PROVIDERS,
  isPricingEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_PRICING,
  isSubscriptionManagementEnabled:
    dashboardEnvironment.NEXT_PUBLIC_ENABLE_SUBSCRIPTION_MANAGEMENT,
  isAnalyticsEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_ANALYTICS,
  analyticsModules: dashboardEnvironment.NEXT_PUBLIC_ANALYTICS_MODULES,
  isDarkModeEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_DARK_MODE,
  isCustomizableDashboardEnabled:
    dashboardEnvironment.NEXT_PUBLIC_ENABLE_CUSTOMIZABLE_DASHBOARD,
  isGuidedOnboardingEnabled:
    dashboardEnvironment.NEXT_PUBLIC_ENABLE_GUIDED_ONBOARDING,
  isLazyLoadingEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_LAZY_LOADING,
  isServiceWorkerEnabled:
    dashboardEnvironment.NEXT_PUBLIC_ENABLE_SERVICE_WORKER,
  isSmartGoalsEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_SMART_GOALS,
  smartGoalFeatures: dashboardEnvironment.NEXT_PUBLIC_SMART_GOAL_FEATURES,
  isMilestonesEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_MILESTONES,
  milestoneFeatures: dashboardEnvironment.NEXT_PUBLIC_MILESTONE_FEATURES,
  isForecastsEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_FORECASTS,
  forecastFeatures: dashboardEnvironment.NEXT_PUBLIC_FORECAST_FEATURES,
  isBetaFeaturesEnabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_BETA_FEATURES,
  uiVersion: dashboardEnvironment.NEXT_PUBLIC_NEW_UI_VERSION,
  isPaymentsEnabled: dashboardEnvironment.NEXT_PUBLIC_PAYMENTS_ENABLED,
  isAnalyticsV2Enabled: dashboardEnvironment.NEXT_PUBLIC_ENABLE_ANALYTICS_V2,
};
