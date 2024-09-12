import { relations } from "drizzle-orm";
// db.ts
import {
  datetime,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { workspaces } from "./workspaces";

export const vercelIntegrations = mysqlTable("vercel_integrations", {
  id: varchar("id", { length: 256 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 256 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  vercelTeamId: varchar("team_id", { length: 256 }),
  accessToken: varchar("access_token", { length: 256 }).notNull(),
  createdAt: datetime("created_at", { fsp: 3 }),
  deletedAt: datetime("deleted_at", { fsp: 3 }),
});

export const vercelBindings = mysqlTable(
  "vercel_bindings",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    integrationId: varchar("integration_id", { length: 256 })
      .notNull()
      .references(() => vercelIntegrations.id, { onDelete: "cascade" }),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: varchar("project_id", { length: 256 }).notNull(),
    environment: mysqlEnum("environment", [
      "development",
      "preview",
      "production",
    ]).notNull(),
    resourceId: varchar("resource_id", { length: 256 }).notNull(),
    resourceType: mysqlEnum("resource_type", ["rootKey", "apiId"]).notNull(),
    vercelEnvId: varchar("vercel_env_id", { length: 256 }).notNull(),
    createdAt: datetime("created_at", { fsp: 3 }).notNull(),
    updatedAt: datetime("updated_at", { fsp: 3 }).notNull(),
    deletedAt: datetime("deleted_at", { fsp: 3 }),
    // userId
    lastEditedBy: varchar("last_edited_by", { length: 256 }).notNull(),
  },
  (table) => ({
    uniqueProjectEnvironmentResourceIndex: uniqueIndex(
      "project_environment_resource_type_idx",
    ).on(table.projectId, table.environment, table.resourceType),
  }),
);

export const vercelIntegrationRelations = relations(
  vercelIntegrations,
  ({ many, one }) => ({
    workspace: one(workspaces, {
      relationName: "vercel_workspace_relation",
      fields: [vercelIntegrations.workspaceId],
      references: [workspaces.id],
    }),
    // keys: many(keys,),
    vercelBindings: many(vercelBindings),
  }),
);

export const vercelBindingRelations = relations(vercelBindings, ({ one }) => ({
  workspace: one(workspaces, {
    relationName: "vercel_key_binding_relation",
    fields: [vercelBindings.workspaceId],
    references: [workspaces.id],
  }),
  vercelIntegrations: one(vercelIntegrations, {
    fields: [vercelBindings.integrationId],
    references: [vercelIntegrations.id],
  }),
}));
