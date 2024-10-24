import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users';

// Define valid environments and scopes
export type APIKeyEnvironment = 'development' | 'staging' | 'production';
export type APIKeyScope = 'read' | 'write' | 'admin' | 'full';

/**
 * Helper functions to handle array serialization/deserialization
 */
export const arrayHelpers = {
  serialize: <T>(arr: T[]): string => JSON.stringify(arr),
  deserialize: <T>(str: string | null): T[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
};

export const apiKeys = sqliteTable('api_keys', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  scope: text('scope', { mode: 'json' }).$type<APIKeyScope[]>()
    .notNull()
    .default(sql`'["read"]'`),
  rateLimit: integer('rate_limit').notNull().default(1000),
  allowedIPs: text('allowed_ips', { mode: 'json' }).$type<string[]>()
    .default(sql`'[]'`),
  allowedDomains: text('allowed_domains', { mode: 'json' }).$type<string[]>()
    .default(sql`'[]'`),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsedIP: text('last_used_ip'),
  environment: text('environment').$type<APIKeyEnvironment>()
    .notNull()
    .default('development'),
  revoked: integer('revoked', { mode: 'boolean' }).notNull().default(false),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedReason: text('revoked_reason'),
  keyId: text('key_id'),
}, (table) => ({
  keyIndex: uniqueIndex('key_idx').on(table.key),
}));

export type APIKey = typeof apiKeys.$inferSelect;
export type NewAPIKey = typeof apiKeys.$inferInsert;

// Helper function to validate boolean values
export function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

// Helper function to validate scopes
export function isValidScope(scope: unknown): scope is APIKeyScope {
  const validScopes: APIKeyScope[] = ['read', 'write', 'admin', 'full'];
  return typeof scope === 'string' && validScopes.includes(scope as APIKeyScope);
}

// Helper function to validate environment
export function isValidEnvironment(env: unknown): env is APIKeyEnvironment {
  const validEnvironments: APIKeyEnvironment[] = ['development', 'staging', 'production'];
  return typeof env === 'string' && validEnvironments.includes(env as APIKeyEnvironment);
}

// Helper function to validate IP address
export function isValidIPAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Helper function to validate domain
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
}

// Validation helper for new API keys
export function validateNewAPIKey(key: NewAPIKey): string[] {
  const errors: string[] = [];

  // Validate required fields
  if (!key.name?.trim()) {
    errors.push('Name is required');
  }

  // Validate arrays
  if (key.scope && (!Array.isArray(key.scope) || !key.scope.every(isValidScope))) {
    errors.push('Invalid scope array');
  }

  if (key.allowedIPs && (!Array.isArray(key.allowedIPs) || !key.allowedIPs.every(isValidIPAddress))) {
    errors.push('Invalid IP addresses array');
  }

  if (key.allowedDomains && (!Array.isArray(key.allowedDomains) || !key.allowedDomains.every(isValidDomain))) {
    errors.push('Invalid domains array');
  }

  // Validate environment
  if (key.environment && !isValidEnvironment(key.environment)) {
    errors.push('Invalid environment');
  }

  // Validate dates
  if (key.expiresAt && new Date(key.expiresAt).toString() === 'Invalid Date') {
    errors.push('Invalid expiration date');
  }

  // Validate boolean fields
  if (key.isActive !== undefined && !isValidBoolean(key.isActive)) {
    errors.push('isActive must be a boolean value');
  }

  if (key.revoked !== undefined && !isValidBoolean(key.revoked)) {
    errors.push('revoked must be a boolean value');
  }

  // Validate integer fields
  if (key.rateLimit !== undefined && (!Number.isInteger(key.rateLimit) || key.rateLimit < 0)) {
    errors.push('rateLimit must be a non-negative integer');
  }

  if (key.usageCount !== undefined && (!Number.isInteger(key.usageCount) || key.usageCount < 0)) {
    errors.push('usageCount must be a non-negative integer');
  }

  // Validate related boolean-date fields
  if (key.revoked && !key.revokedAt) {
    errors.push('revokedAt is required when key is revoked');
  }

  if (key.revoked && !key.revokedReason?.trim()) {
    errors.push('revokedReason is required when key is revoked');
  }

  if (!key.revoked && key.revokedAt) {
    errors.push('revokedAt should not be set for non-revoked keys');
  }

  return errors;
}