import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { businessAccounts } from "./business-accounts";
import { roleTypeEnum } from "./enums";
import { roleAuditEvents } from "./role-audit-events";
import { teams } from "./teams";
import { userAccounts } from "./user-accounts";

// Tables
/**
 * Represents the roles table in the database.
 * This table stores information about different roles and their associated permissions.
 *
 * @property {number} id - Unique identifier for the role.
 * @property {string} name - Unique name of the role (max 255 characters).
 * @property {RoleType} type - Type of the role (e.g., SUPER_ADMIN, TEAM_ADMIN, REGULAR).
 * @property {boolean} canCreateUsers - Permission to create users (default: false).
 * @property {boolean} canReadUsers - Permission to read user information (default: false).
 * @property {boolean} canUpdateUsers - Permission to update user information (default: false).
 * @property {boolean} canDeleteUsers - Permission to delete users (default: false).
 * @property {boolean} canCreateProjects - Permission to create projects (default: false).
 * @property {boolean} canReadProjects - Permission to read project information (default: false).
 * @property {boolean} canUpdateProjects - Permission to update project information (default: false).
 * @property {boolean} canDeleteProjects - Permission to delete projects (default: false).
 * @property {boolean} canCreateReports - Permission to create reports (default: false).
 * @property {boolean} canReadReports - Permission to read report information (default: false).
 * @property {boolean} canUpdateReports - Permission to update report information (default: false).
 * @property {boolean} canDeleteReports - Permission to delete reports (default: false).
 * @property {Date} createdAt - Timestamp of when the role was created.
 * @property {Date} updatedAt - Timestamp of when the role was last updated.
 * @property {number | null} teamId - Foreign key referencing the associated team.
 * @property {number | null} userAccountId - Foreign key referencing the associated user account.
 * @property {number | null} businessAccountId - Foreign key referencing the associated business account.
 */
export const roles = sqliteTable("roles", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 255 }).notNull().unique(),
  type: roleTypeEnum,
  canCreateUsers: integer("can_create_users", { mode: "boolean" }).default(
    false,
  ),
  canReadUsers: integer("can_read_users", { mode: "boolean" }).default(false),
  canUpdateUsers: integer("can_update_users", { mode: "boolean" }).default(
    false,
  ),
  canDeleteUsers: integer("can_delete_users", { mode: "boolean" }).default(
    false,
  ),
  canCreateProjects: integer("can_create_projects", {
    mode: "boolean",
  }).default(false),
  canReadProjects: integer("can_read_projects", { mode: "boolean" }).default(
    false,
  ),
  canUpdateProjects: integer("can_update_projects", {
    mode: "boolean",
  }).default(false),
  canDeleteProjects: integer("can_delete_projects", {
    mode: "boolean",
  }).default(false),
  canCreateReports: integer("can_create_reports", { mode: "boolean" }).default(
    false,
  ),
  canReadReports: integer("can_read_reports", { mode: "boolean" }).default(
    false,
  ),
  canUpdateReports: integer("can_update_reports", { mode: "boolean" }).default(
    false,
  ),
  canDeleteReports: integer("can_delete_reports", { mode: "boolean" }).default(
    false,
  ),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
  teamId: integer("team_id").references(() => teams.id),
  userAccountId: integer("user_account_id").references(() => userAccounts.id),
  businessAccountId: integer("business_account_id").references(
    () => businessAccounts.id,
  ),
});

/**
 * Defines the relationships between the roles table and other tables.
 *
 * @property {Relation} team - One-to-one relationship with the teams table.
 *                             Links a role to its associated team.
 * @property {Relation} userAccount - One-to-one relationship with the userAccounts table.
 *                                    Links a role to its associated user account.
 * @property {Relation} businessAccount - One-to-one relationship with the businessAccounts table.
 *                                        Links a role to its associated business account.
 * @property {Relation} auditEvents - One-to-many relationship with the roleAuditEvents table.
 *                                    Links a role to its audit events history.
 */
export const rolesRelations = relations(roles, ({ one, many }) => ({
  team: one(teams, {
    fields: [roles.teamId],
    references: [teams.id],
  }),
  userAccount: one(userAccounts, {
    fields: [roles.userAccountId],
    references: [userAccounts.id],
  }),
  businessAccount: one(businessAccounts, {
    fields: [roles.businessAccountId],
    references: [businessAccounts.id],
  }),
  auditEvents: many(roleAuditEvents),
}));

export type Role = typeof roles.$inferSelect; // return type when queried
export type NewRole = typeof roles.$inferInsert; // insert type
