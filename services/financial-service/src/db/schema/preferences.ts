import { sql } from 'drizzle-orm';
import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users';

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
/**
 * Defines the structure of the user preferences table, which contains configuration
 * and settings for the platform, such as service tiers, API settings, rate limits, 
 * compliance settings, and UI preferences. This table stores user-specific preferences 
 * that are used to customize the platform for fintech developers.
 */
// Define the user preferences table for fintech platform users
export const preferences = sqliteTable('user_preferences', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),

    // Platform Settings
    serviceTier: text('service_tier').$type<ServiceTier>().notNull().default('starter'), // Fintech tiers: starter, pro, enterprise
    complianceLevel: text('compliance_level').$type<ComplianceLevel>().notNull().default('basic'), // Compliance levels: basic, intermediate, advanced

    // API Configuration (critical for fintech apps)
    defaultApiVersion: text('default_api_version').default('v1'), // Default API version for users' integrations
    webhookUrl: text('webhook_url'), // URL to receive webhooks, important for real-time financial updates
    webhookEvents: blob('webhook_events', { mode: 'json' }).$type<WebhookEventType[]>(), // Specific events they want notifications for
    sandboxMode: integer('sandbox_mode', { mode: 'boolean' }).default(true), // Enables testing environment
    testDataEnabled: integer('test_data_enabled', { mode: 'boolean' }).default(true), // Allows use of test data for development and simulations

    // Rate Limits & Quotas (prevents abuse and ensures fair usage)
    maxRequestsPerSecond: integer('max_requests_per_second').default(10), // API rate limit per user to prevent abuse
    maxTransactionsPerDay: integer('max_transactions_per_day').default(1000), // Controls the number of daily transactions processed
    maxAccountsPerUser: integer('max_accounts_per_user').default(5), // Limits the number of accounts each user can manage

    // Notification Settings (financial alerts are critical for fintech)
    emailNotificationApiKey: integer('email_notification_api_key', { mode: 'boolean' }).default(true), // Whether API key notifications are enabled
    emailNotificationQuota: integer('email_notification_quota', { mode: 'boolean' }).default(true), // Quota for notification-related emails
    emailNotificationSecurity: integer('email_notification_security', { mode: 'boolean' }).default(true), // Security alerts for user accounts
    emailNotificationCompliance: integer('email_notification_compliance', { mode: 'boolean' }).default(true), // Compliance alerts, such as failed KYC
    transactionAlertThreshold: integer('transaction_alert_threshold').default(10000), // Threshold to trigger transaction alerts
    transactionAlertEnabled: integer('transaction_alert_enabled', { mode: 'boolean' }).default(true), // Controls whether alerts are enabled

    // Compliance & Security (crucial for fintech platforms)
    ipWhitelist: blob('ip_whitelist', { mode: 'json' }).$type<string[]>(), // IP addresses allowed to access the API for extra security
    mfaEnabled: integer('mfa_enabled', { mode: 'boolean' }).default(false), // Multi-factor authentication for better security
    auditLogRetention: integer('audit_log_retention').default(365), // Retention period for audit logs (in days), useful for compliance

    // Timestamp columns
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`), // Timestamp when preferences were created
    updatedAt: integer('updated_at', { mode: 'timestamp' })
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

export type NewPreferences = typeof preferences.$inferInsert;
export type Preferences = typeof preferences.$inferSelect;

// Helper function to validate boolean values
export function isValidBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

// Helper function to validate positive integers
export function isValidPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// Helper function to validate URL
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Helper function to validate IP address
export function isValidIPAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

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

// Helper function to validate rate limits
export function validateRateLimits(
    maxRequestsPerSecond?: number,
    maxTransactionsPerDay?: number,
    maxAccountsPerUser?: number
): string[] {
    const errors: string[] = [];

    if (maxRequestsPerSecond !== undefined && !isValidPositiveInteger(maxRequestsPerSecond)) {
        errors.push('maxRequestsPerSecond must be a non-negative integer');
    }

    if (maxTransactionsPerDay !== undefined && !isValidPositiveInteger(maxTransactionsPerDay)) {
        errors.push('maxTransactionsPerDay must be a non-negative integer');
    }

    if (maxAccountsPerUser !== undefined && !isValidPositiveInteger(maxAccountsPerUser)) {
        errors.push('maxAccountsPerUser must be a non-negative integer');
    }

    return errors;
}

// Validation helper for preferences
export function validatePreferences(prefs: Partial<NewPreferences> | Partial<Preferences>): string[] {
    const errors: string[] = [];

    // Validate required fields
    if ('serviceTier' in prefs && !isValidServiceTier(prefs.serviceTier)) {
        errors.push('Invalid service tier');
    }

    if ('complianceLevel' in prefs && !isValidComplianceLevel(prefs.complianceLevel)) {
        errors.push('Invalid compliance level');
    }

    // Validate rate limits
    const rateLimitErrors = validateRateLimits(
        prefs.maxRequestsPerSecond ?? undefined,
        prefs.maxTransactionsPerDay ?? undefined,
        prefs.maxAccountsPerUser ?? undefined
    );
    errors.push(...rateLimitErrors);

    // Validate webhook configuration
    if (prefs.webhookUrl !== undefined && prefs.webhookUrl !== null) {
        if (!isValidUrl(prefs.webhookUrl)) {
            errors.push('Invalid webhook URL');
        }
    }

    if (prefs.webhookEvents !== undefined) {
        if (!Array.isArray(prefs.webhookEvents)) {
            errors.push('webhookEvents must be an array');
        } else if (!prefs.webhookEvents.every(isValidWebhookEvent)) {
            errors.push('Invalid webhook event type(s)');
        }
    }

    // Validate boolean fields
    if ('sandboxMode' in prefs && !isValidBoolean(prefs.sandboxMode)) {
        errors.push('sandboxMode must be a boolean value');
    }

    if ('testDataEnabled' in prefs && !isValidBoolean(prefs.testDataEnabled)) {
        errors.push('testDataEnabled must be a boolean value');
    }

    if ('mfaEnabled' in prefs && !isValidBoolean(prefs.mfaEnabled)) {
        errors.push('mfaEnabled must be a boolean value');
    }

    // Validate email notification settings
    if ('emailNotificationApiKey' in prefs && !isValidBoolean(prefs.emailNotificationApiKey)) {
        errors.push('emailNotificationApiKey must be a boolean value');
    }

    if ('emailNotificationQuota' in prefs && !isValidBoolean(prefs.emailNotificationQuota)) {
        errors.push('emailNotificationQuota must be a boolean value');
    }

    if ('emailNotificationSecurity' in prefs && !isValidBoolean(prefs.emailNotificationSecurity)) {
        errors.push('emailNotificationSecurity must be a boolean value');
    }

    if ('emailNotificationCompliance' in prefs && !isValidBoolean(prefs.emailNotificationCompliance)) {
        errors.push('emailNotificationCompliance must be a boolean value');
    }

    // Validate IP whitelist
    if (prefs.ipWhitelist !== undefined && prefs.ipWhitelist !== null) {
        if (!Array.isArray(prefs.ipWhitelist)) {
            errors.push('ipWhitelist must be an array');
        } else if (!prefs.ipWhitelist.every(isValidIPAddress)) {
            errors.push('Invalid IP address(es) in whitelist');
        }
    }

    // Validate retention periods
    if (prefs.auditLogRetention !== undefined && !isValidPositiveInteger(prefs.auditLogRetention)) {
        errors.push('auditLogRetention must be a non-negative integer');
    }

    // Validate alert settings
    if (prefs.transactionAlertThreshold !== undefined && !isValidPositiveInteger(prefs.transactionAlertThreshold)) {
        errors.push('transactionAlertThreshold must be a non-negative integer');
    }

    if ('transactionAlertEnabled' in prefs && !isValidBoolean(prefs.transactionAlertEnabled)) {
        errors.push('transactionAlertEnabled must be a boolean value');
    }

    return errors;
}

// Helper function to validate service tier limits
export function validateServiceTierLimits(prefs: Partial<Preferences>, tier: ServiceTier): string[] {
    const errors: string[] = [];

    switch (tier) {
        case 'starter':
            if (prefs.maxRequestsPerSecond && prefs.maxRequestsPerSecond > 10) {
                errors.push('Starter tier cannot exceed 10 requests per second');
            }
            if (prefs.maxTransactionsPerDay && prefs.maxTransactionsPerDay > 1000) {
                errors.push('Starter tier cannot exceed 1000 transactions per day');
            }
            if (prefs.maxAccountsPerUser && prefs.maxAccountsPerUser > 5) {
                errors.push('Starter tier cannot exceed 5 accounts per user');
            }
            break;

        case 'growth':
            if (prefs.maxRequestsPerSecond && prefs.maxRequestsPerSecond > 100) {
                errors.push('Growth tier cannot exceed 100 requests per second');
            }
            if (prefs.maxTransactionsPerDay && prefs.maxTransactionsPerDay > 10000) {
                errors.push('Growth tier cannot exceed 10000 transactions per day');
            }
            if (prefs.maxAccountsPerUser && prefs.maxAccountsPerUser > 1000) {
                errors.push('Growth tier cannot exceed 1000 accounts per user');
            }
            break;

        case 'enterprise':
            if (prefs.maxRequestsPerSecond && prefs.maxRequestsPerSecond > 1000) {
                errors.push('Enterprise tier cannot exceed 1000 requests per second');
            }
            if (prefs.maxTransactionsPerDay && prefs.maxTransactionsPerDay > 100000) {
                errors.push('Enterprise tier cannot exceed 100000 transactions per day');
            }
            if (prefs.maxAccountsPerUser && prefs.maxAccountsPerUser > 10000) {
                errors.push('Enterprise tier cannot exceed 10000 accounts per user');
            }
            break;
    }

    return errors;
}

/**
 * Creates default preferences based on the service tier.
 * This helper function generates appropriate default values for all preference fields
 * based on the specified service tier.
 *
 * @param serviceTier - The service tier to create defaults for ('starter', 'growth', 'enterprise', or 'custom')
 * @returns A NewPreferences object with all default values set
 */
export function createDefaultPreferences(serviceTier: ServiceTier = 'starter'): Omit<NewPreferences, 'userId'> {
    // Base preferences that are common across all tiers
    const basePreferences: Omit<NewPreferences, 'userId'> = {
        serviceTier,
        complianceLevel: 'basic',
        defaultApiVersion: 'v1',
        webhookUrl: null,
        webhookEvents: [],
        sandboxMode: true,
        testDataEnabled: true,
        maxRequestsPerSecond: 10,
        maxTransactionsPerDay: 1000,
        maxAccountsPerUser: 5,
        emailNotificationApiKey: false,
        emailNotificationQuota: false,
        emailNotificationSecurity: false,
        emailNotificationCompliance: false,
        transactionAlertThreshold: 10000,
        transactionAlertEnabled: false,
        ipWhitelist: null,
        mfaEnabled: false,
        auditLogRetention: 365,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Customize settings based on service tier
    switch (serviceTier) {
        case 'enterprise':
            return {
                ...basePreferences,
                complianceLevel: 'enhanced',
                maxRequestsPerSecond: 1000,
                maxTransactionsPerDay: 100000,
                maxAccountsPerUser: 10000,
                emailNotificationApiKey: true,
                emailNotificationQuota: true,
                emailNotificationSecurity: true,
                emailNotificationCompliance: true,
                transactionAlertThreshold: 50000,
                transactionAlertEnabled: true,
                ipWhitelist: ['0.0.0.0/0'],  // Allow all IPs by default, can be customized
                mfaEnabled: true,             // Enforce MFA for enterprise
                auditLogRetention: 730,       // 2 years retention for enterprise
                sandboxMode: false,           // Production mode by default for enterprise
                testDataEnabled: false        // Disable test data by default for enterprise
            };

        case 'growth':
            return {
                ...basePreferences,
                complianceLevel: 'standard',
                maxRequestsPerSecond: 100,
                maxTransactionsPerDay: 10000,
                maxAccountsPerUser: 1000,
                emailNotificationApiKey: true,
                emailNotificationQuota: true,
                emailNotificationSecurity: true,
                emailNotificationCompliance: true,
                transactionAlertThreshold: 25000,
                transactionAlertEnabled: true,
                ipWhitelist: [],              // Empty array for growth tier
                auditLogRetention: 365,       // 1 year retention for growth
                sandboxMode: true,            // Sandbox enabled by default
                testDataEnabled: true         // Test data enabled by default
            };

        case 'custom':
            return {
                ...basePreferences,
                complianceLevel: 'standard',  // Start with standard compliance
                maxRequestsPerSecond: 500,    // Moderate default for custom tier
                maxTransactionsPerDay: 50000, // Moderate default for custom tier
                maxAccountsPerUser: 5000,     // Moderate default for custom tier
                emailNotificationApiKey: true,
                emailNotificationQuota: true,
                emailNotificationSecurity: true,
                emailNotificationCompliance: true,
                transactionAlertThreshold: 25000,
                transactionAlertEnabled: true,
                ipWhitelist: [],              // Empty array for custom tier
                auditLogRetention: 365,       // 1 year retention by default
                // Other settings remain as base defaults
            };

        default: // 'starter' tier
            return {
                ...basePreferences,
                // Starter tier uses all base defaults
                maxRequestsPerSecond: 10,
                maxTransactionsPerDay: 1000,
                maxAccountsPerUser: 5,
                transactionAlertThreshold: 10000,
                auditLogRetention: 90,        // 90 days retention for starter
                sandboxMode: true,            // Sandbox enabled by default
                testDataEnabled: true         // Test data enabled by default
            };
    }
}