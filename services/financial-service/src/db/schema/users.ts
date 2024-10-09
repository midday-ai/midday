import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  // Add password hash field
  passwordHash: text('password_hash').notNull(),
  // Add role for user authorization
  role: text('role').default('user'),
  // Add avatar image URL
  avatarUrl: text('avatar_url'),
  // Add bio or description
  bio: text('bio'),
  // Add phone number
  phoneNumber: text('phone_number'),
  // Add boolean for email verification status
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(false),
  // Add last login timestamp
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  // Add account status (e.g., 'active', 'suspended', 'deactivated')
  status: text('status').default('active'),
  // Add preferences as a JSON blob
  preferences: blob('preferences', { mode: 'json' }),
  // Existing timestamp fields
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;