import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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

// Define valid user roles with financial context
export type UserRole =
  | "platform_admin"
  | "developer"
  | "compliance_officer"
  | "support"
  | "readonly";

// Define user status with compliance context
export type UserStatus =
  | "active"
  | "suspended"
  | "pending_verification"
  | "compliance_review"
  | "deactivated";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().default("developer"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  isEmailVerified: integer("is_email_verified", { mode: "boolean" }).default(
    false,
  ),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  status: text("status").$type<UserStatus>().default("pending_verification"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
