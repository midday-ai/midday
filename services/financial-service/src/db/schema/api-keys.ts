import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { users } from './users'; // Assuming you have a users table defined

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  scope: text('scope').notNull().default('default'),
  rateLimit: integer('rate_limit').notNull().default(1000),
  allowedIPs: text('allowed_ips'),
  allowedDomains: text('allowed_domains'),
  usageCount: integer('usage_count').notNull().default(0),
  lastUsedIP: text('last_used_ip'),
  environment: text('environment').notNull().default('development'),
  revoked: integer('revoked', { mode: 'boolean' }).notNull().default(false),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedReason: text('revoked_reason'),
  keyId: text('key_id'),
}, (table) => ({
  userIdIndex: uniqueIndex('user_id_idx').on(table.userId),
  keyIndex: uniqueIndex('key_idx').on(table.key),
  expirationIndex: uniqueIndex('expiration_idx').on(table.expiresAt),
  environmentIndex: uniqueIndex('environment_idx').on(table.environment),
}));

export type APIKey = typeof apiKeys.$inferSelect;
export type NewAPIKey = typeof apiKeys.$inferInsert;