import { sql } from 'drizzle-orm';
import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Define valid user roles with financial context
export type UserRole = 'platform_admin' | 'developer' | 'compliance_officer' | 'support' | 'readonly';

// Define user status with compliance context
export type UserStatus = 'active' | 'suspended' | 'pending_verification' | 'compliance_review' | 'deactivated';

// Define service tiers
export type ServiceTier = 'starter' | 'growth' | 'enterprise' | 'custom';

// Define compliance levels
export type ComplianceLevel = 'basic' | 'standard' | 'enhanced';

// Define webhook event types
export type WebhookEventType =
  | 'transaction.created'
  | 'transaction.updated'
  | 'account.created'
  | 'kyc.verified'
  | 'payment.processed'
  | 'transfer.completed'
  | 'risk.alert';

// Define user preferences with financial platform context
export interface UserPreferences {
  // Platform Settings
  serviceTier: ServiceTier;
  complianceLevel: ComplianceLevel;

  // API Configuration
  defaultApiVersion?: string;
  webhookUrl?: string;
  webhookEvents?: WebhookEventType[];
  sandboxMode?: boolean;
  testDataEnabled?: boolean;

  // Rate Limits & Quotas
  maxRequestsPerSecond?: number;
  maxTransactionsPerDay?: number;
  maxAccountsPerUser?: number;

  // Notification Settings
  emailNotifications?: {
    apiKeyExpiration?: boolean;
    quotaAlerts?: boolean;
    securityAlerts?: boolean;
    complianceUpdates?: boolean;
    transactionAlerts?: {
      threshold: number;
      enabled: boolean;
    };
  };

  // Compliance & Security
  ipWhitelist?: string[];
  mfaEnabled?: boolean;
  auditLogRetention?: number; // days
  dataRetentionPeriod?: number; // days

  // Financial Settings
  supportedCurrencies?: string[];
  defaultCurrency?: string;
  transactionLimits?: {
    daily?: number;
    monthly?: number;
    perTransaction?: number;
  };

  // UI Preferences
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  dateFormat?: string;
  language?: string;
  dashboardLayout?: {
    widgets: string[];
    defaultView: 'summary' | 'detailed';
  };
}

/**
 * Helper functions to handle JSON serialization/deserialization for preferences
 */
export const jsonHelpers = {
  serialize: <T>(obj: T): string => JSON.stringify(obj),
  deserialize: <T>(str: string | null): T | null => {
    if (!str) return null;
    try {
      return JSON.parse(str) as T;
    } catch {
      return null;
    }
  },
};

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<UserRole>().default('developer'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  phoneNumber: text('phone_number'),
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(false),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  status: text('status').$type<UserStatus>().default('pending_verification'),
  preferences: blob('preferences', { mode: 'json' }).$type<UserPreferences>(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Helper function to validate service tier
export function isValidServiceTier(tier: unknown): tier is ServiceTier {
  const validTiers: ServiceTier[] = ['starter', 'growth', 'enterprise', 'custom'];
  return typeof tier === 'string' && validTiers.includes(tier as ServiceTier);
}

// Helper function to validate compliance level
export function isValidComplianceLevel(level: unknown): level is ComplianceLevel {
  const validLevels: ComplianceLevel[] = ['basic', 'standard', 'enhanced'];
  return typeof level === 'string' && validLevels.includes(level as ComplianceLevel);
}

// Helper function to validate webhook event type
export function isValidWebhookEvent(event: unknown): event is WebhookEventType {
  const validEvents: WebhookEventType[] = [
    'transaction.created',
    'transaction.updated',
    'account.created',
    'kyc.verified',
    'payment.processed',
    'transfer.completed',
    'risk.alert'
  ];
  return typeof event === 'string' && validEvents.includes(event as WebhookEventType);
}

// Helper function to validate preferences
export function isValidPreferences(prefs: unknown): prefs is UserPreferences {
  if (!prefs || typeof prefs !== 'object') return false;

  const preferences = prefs as UserPreferences;

  // Validate required fields
  if (!isValidServiceTier(preferences.serviceTier)) return false;
  if (!isValidComplianceLevel(preferences.complianceLevel)) return false;

  // Validate rate limits
  if (preferences.maxRequestsPerSecond !== undefined &&
    (typeof preferences.maxRequestsPerSecond !== 'number' || preferences.maxRequestsPerSecond < 0)) {
    return false;
  }

  // Validate webhook events if present
  if (preferences.webhookEvents !== undefined) {
    if (!Array.isArray(preferences.webhookEvents) ||
      !preferences.webhookEvents.every(isValidWebhookEvent)) {
      return false;
    }
  }

  // Validate transaction limits if present
  if (preferences.transactionLimits) {
    const { daily, monthly, perTransaction } = preferences.transactionLimits;
    if ((daily !== undefined && (typeof daily !== 'number' || daily < 0)) ||
      (monthly !== undefined && (typeof monthly !== 'number' || monthly < 0)) ||
      (perTransaction !== undefined && (typeof perTransaction !== 'number' || perTransaction < 0))) {
      return false;
    }
  }

  return true;
}

// Create default preferences based on service tier
export function createDefaultPreferences(serviceTier: ServiceTier = 'starter'): UserPreferences {
  const basePreferences: UserPreferences = {
    serviceTier,
    complianceLevel: 'basic',
    sandboxMode: true,
    testDataEnabled: true,
    emailNotifications: {
      apiKeyExpiration: true,
      quotaAlerts: true,
      securityAlerts: true,
      complianceUpdates: true,
      transactionAlerts: {
        threshold: 10000,
        enabled: true,
      },
    },
    mfaEnabled: false,
    auditLogRetention: 30,
    dataRetentionPeriod: 90,
    defaultCurrency: 'USD',
    supportedCurrencies: ['USD'],
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dashboardLayout: {
      widgets: ['transactions', 'api-usage', 'alerts'],
      defaultView: 'summary',
    },
  };

  // Add tier-specific settings
  switch (serviceTier) {
    case 'enterprise':
      return {
        ...basePreferences,
        maxRequestsPerSecond: 1000,
        maxTransactionsPerDay: 100000,
        maxAccountsPerUser: 10000,
        complianceLevel: 'enhanced',
      };
    case 'growth':
      return {
        ...basePreferences,
        maxRequestsPerSecond: 100,
        maxTransactionsPerDay: 10000,
        maxAccountsPerUser: 1000,
        complianceLevel: 'standard',
      };
    default: // starter
      return {
        ...basePreferences,
        maxRequestsPerSecond: 10,
        maxTransactionsPerDay: 1000,
        maxAccountsPerUser: 100,
      };
  }
}