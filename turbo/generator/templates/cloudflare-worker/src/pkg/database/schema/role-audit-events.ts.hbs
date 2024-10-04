import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { auditActionEnum } from "./enums";
import { roles } from "./roles";

/**
 * Represents the role_audit_events table in the database.
 * This table stores audit events related to role changes, providing a detailed history of modifications.
 *
 * @property {number} id - Unique identifier for the audit event.
 * @property {AuditAction} action - The type of action performed (e.g., CREATED, UPDATED, DELETED).
 * @property {string} performedBy - Identifier of the user who performed the action.
 * @property {Date} timestamp - The date and time when the action was performed.
 * @property {string | null} affectedFields - JSON string containing the names of fields that were affected.
 * @property {string | null} previousValues - JSON string containing the previous values of affected fields.
 * @property {string | null} clientIp - IP address of the client that initiated the action.
 * @property {string | null} userAgent - User agent string of the client that initiated the action.
 * @property {string | null} context - Additional context or metadata about the audit event.
 * @property {number | null} roleId - Foreign key referencing the affected role in the roles table.
 */
export const roleAuditEvents = sqliteTable("role_audit_events", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  action: auditActionEnum,
  performedBy: text("performed_by").notNull(),
  timestamp: text("timestamp").default(sql`(CURRENT_TIMESTAMP)`),
  affectedFields: text("affected_fields"),
  previousValues: text("previous_values"),
  clientIp: text("client_ip"),
  userAgent: text("user_agent"),
  context: text("context"),
  roleId: integer("role_id").references(() => roles.id),
});

export type RoleAuditEvent = typeof roleAuditEvents.$inferSelect; // return type when queried
export type NewRoleAuditEvent = typeof roleAuditEvents.$inferInsert; // insert type
