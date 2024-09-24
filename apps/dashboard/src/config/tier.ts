import { UserTier } from "@midday/supabase/types";

/**
 * Represents the available subscription tiers.
 */
export type Tier = UserTier;

/**
 * Types of basic reports available across tiers.
 */
type BasicReportType = "transactionSummary" | "monthlyOverview" | "categoryBreakdown";

/**
 * Types of advanced reports available in higher tiers.
 */
type AdvancedReportType = "cashFlowAnalysis" | "budgetPerformance" | "forecastingTrends";

/**
 * Types of enterprise-level reports.
 */
type EnterpriseReportType = "customReports" | "aiDrivenInsights" | "riskAnalysis";

/**
 * Structure defining the reporting features available for each tier.
 */
interface ReportingFeatures {
  basic: BasicReportType[];
  advanced: AdvancedReportType[];
  enterprise: EnterpriseReportType[];
}

/**
 * Types of analytics features available across tiers.
 */
type AnalyticsFeature = "realTimeData" | "historicalTrends" | "predictiveAnalytics" | "benchmarking" | "anomalyDetection";

/**
 * General features available across different tiers.
 */
type Feature = 
  | "apiAccess" 
  | "customIntegrations" 
  | "prioritySupport" 
  | "dataExport" 
  | "auditLogs" 
  | "ssoIntegration"
  | "multiCurrency"
  | "automatedReconciliation";

/**
 * Defines the numerical and operational limits for each tier.
 */
interface TierLimits {
  /** Maximum number of users allowed */
  maxUsers: number;
  /** Maximum number of transactions allowed */
  maxTransactions: number;
  /** Storage limit in gigabytes */
  storageGB: number;
  /** Frequency of reporting updates */
  reportingFrequency: "daily" | "hourly" | "realTime";
  /** Number of months data is retained */
  dataRetentionMonths: number;
}

/**
 * Comprehensive details about a specific tier.
 */
interface TierDetails {
  /** The tier identifier */
  name: Tier;
  /** User-friendly name of the tier */
  displayName: string;
  /** List of features available in this tier */
  features: Feature[];
  /** Reporting capabilities of this tier */
  reportingFeatures: ReportingFeatures;
  /** Analytics features available in this tier */
  analyticsFeatures: AnalyticsFeature[];
  /** Numerical and operational limits of this tier */
  limits: TierLimits;
  /** Monthly price in cents */
  price: number;
}

/**
 * Detailed configuration for each tier.
 */
const tierConfigurations: Record<Tier, TierDetails> = {
  free: {
    name: "free",
    displayName: "Free",
    features: ["dataExport"],
    reportingFeatures: {
      basic: ["transactionSummary", "monthlyOverview"],
      advanced: [],
      enterprise: [],
    },
    analyticsFeatures: ["historicalTrends"],
    limits: {
      maxUsers: 5,
      maxTransactions: 1000,
      storageGB: 1,
      reportingFrequency: "daily",
      dataRetentionMonths: 3,
    },
    price: 0,
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    features: ["apiAccess", "dataExport", "multiCurrency", "automatedReconciliation"],
    reportingFeatures: {
      basic: ["transactionSummary", "monthlyOverview", "categoryBreakdown"],
      advanced: ["cashFlowAnalysis", "budgetPerformance"],
      enterprise: [],
    },
    analyticsFeatures: ["realTimeData", "historicalTrends", "benchmarking"],
    limits: {
      maxUsers: 20,
      maxTransactions: 10000,
      storageGB: 10,
      reportingFrequency: "hourly",
      dataRetentionMonths: 12,
    },
    price: 1999, // $19.99
  },
  enterprise: {
    name: "enterprise",
    displayName: "Enterprise",
    features: ["apiAccess", "customIntegrations", "prioritySupport", "dataExport", "auditLogs", "ssoIntegration", "multiCurrency", "automatedReconciliation"],
    reportingFeatures: {
      basic: ["transactionSummary", "monthlyOverview", "categoryBreakdown"],
      advanced: ["cashFlowAnalysis", "budgetPerformance", "forecastingTrends"],
      enterprise: ["customReports", "aiDrivenInsights", "riskAnalysis"],
    },
    analyticsFeatures: ["realTimeData", "historicalTrends", "predictiveAnalytics", "benchmarking", "anomalyDetection"],
    limits: {
      maxUsers: 100,
      maxTransactions: 100000,
      storageGB: 100,
      reportingFrequency: "realTime",
      dataRetentionMonths: 84, // 7 years
    },
    price: 9999, // $99.99
  },
};

// Utility functions

/**
 * Retrieves the full details of a specific tier.
 * @param tier - The tier to get details for.
 * @returns The complete details of the specified tier.
 */
export function getTierDetails(tier: Tier): TierDetails {
  return tierConfigurations[tier];
}

/**
 * Checks if a specific feature is available in a given tier.
 * @param tier - The tier to check.
 * @param feature - The feature to look for.
 * @returns True if the feature is available in the tier, false otherwise.
 */
export function hasFeature(tier: Tier, feature: Feature): boolean {
  return tierConfigurations[tier].features.includes(feature);
}

/**
 * Checks if a specific reporting feature is available in a given tier.
 * @param tier - The tier to check.
 * @param reportType - The type of report to look for.
 * @returns True if the reporting feature is available in the tier, false otherwise.
 */
export function hasReportingFeature(tier: Tier, reportType: BasicReportType | AdvancedReportType | EnterpriseReportType): boolean {
  const { reportingFeatures } = tierConfigurations[tier];
  return (
    reportingFeatures.basic.includes(reportType as BasicReportType) ||
    reportingFeatures.advanced.includes(reportType as AdvancedReportType) ||
    reportingFeatures.enterprise.includes(reportType as EnterpriseReportType)
  );
}

/**
 * Checks if a specific analytics feature is available in a given tier.
 * @param tier - The tier to check.
 * @param analyticsFeature - The analytics feature to look for.
 * @returns True if the analytics feature is available in the tier, false otherwise.
 */
export function hasAnalyticsFeature(tier: Tier, analyticsFeature: AnalyticsFeature): boolean {
  return tierConfigurations[tier].analyticsFeatures.includes(analyticsFeature);
}

/**
 * Checks if a given value is within the limits of a specific tier.
 * @param tier - The tier to check against.
 * @param metric - The limit metric to check.
 * @param value - The value to compare against the limit.
 * @returns True if the value is within the tier's limit, false otherwise.
 */
export function isWithinLimits(tier: Tier, metric: keyof TierLimits, value: number): boolean {
  const limit = tierConfigurations[tier].limits[metric];
  return typeof limit === 'number' ? value <= limit : true;
}

/**
 * Determines the next tier for a potential upgrade.
 * @param currentTier - The current tier.
 * @returns The next tier if available, or null if already at the highest tier.
 */
export function getUpgradePath(currentTier: Tier): Tier | null {
  const tiers: Tier[] = ["free", "pro", "enterprise"];
  const currentIndex = tiers.indexOf(currentTier);
  return (currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null) as Tier | null;
}

/**
 * Compares two tiers.
 * @param tierA - The first tier to compare.
 * @param tierB - The second tier to compare.
 * @returns -1 if tierA is lower, 0 if they are the same, 1 if tierA is higher.
 */
export function compareTiers(tierA: Tier, tierB: Tier): -1 | 0 | 1 {
  const tiers: Tier[] = ["free", "pro", "enterprise"];
  const indexA = tiers.indexOf(tierA);
  const indexB = tiers.indexOf(tierB);
  return indexA < indexB ? -1 : indexA > indexB ? 1 : 0;
}

/**
 * Formats the price of a tier into a readable string.
 * @param tier - The tier to get the price for.
 * @returns A formatted string representing the monthly price.
 */
export function formatPrice(tier: Tier): string {
  const priceInCents = tierConfigurations[tier].price;
  return `$${(priceInCents / 100).toFixed(2)}`;
}

/**
 * Determines whether a given tier is the free tier.
 * @param tier - The tier to check.
 * @returns True if the tier is free, false otherwise.
 */
export function isFreeТier(tier: Tier): boolean {
    return tier === "free";
}


export function isProTier(tier: Tier): boolean {
    return tier === "pro";
}

export function isEnterpriseTier(tier: Tier): boolean {
    return tier === "enterprise";
}

/**
 * Demonstrates the usage of various utility functions for tier management.
 */
export function exampleUsage() {
  const userTier: Tier = "pro";
  
  console.log(`User is on ${getTierDetails(userTier).displayName} tier`);
  console.log(`Has API access: ${hasFeature(userTier, "apiAccess")}`);
  console.log(`Can generate cash flow analysis: ${hasReportingFeature(userTier, "cashFlowAnalysis")}`);
  console.log(`Has access to predictive analytics: ${hasAnalyticsFeature(userTier, "predictiveAnalytics")}`);
  console.log(`Can add 15 users: ${isWithinLimits(userTier, "maxUsers", 15)}`);
  console.log(`Reporting frequency: ${getTierDetails(userTier).limits.reportingFrequency}`);
  console.log(`Upgrade path: ${getUpgradePath(userTier)}`);
  console.log(`Pro tier is higher than Free tier: ${compareTiers("pro", "free") > 0}`);
  console.log(`Price: ${formatPrice(userTier)} per month`);
}

export default Tier;