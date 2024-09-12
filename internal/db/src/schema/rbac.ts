import { relations } from "drizzle-orm";
import {
  bigint,
  datetime,
  index,
  mysqlTable,
  primaryKey,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { keys } from "./keys";
import { workspaces } from "./workspaces";

export const permissions = mysqlTable(
  "permissions",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 512 }).notNull(),
    description: varchar("description", { length: 512 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
  },
  (table) => {
    return {
      workspaceIdIdx: index("workspace_id_idx").on(table.workspaceId),
      uniqueNamePerWorkspaceIdx: unique("unique_name_per_workspace_idx").on(
        table.name,
        table.workspaceId,
      ),
    };
  },
);
export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [permissions.workspaceId],
    references: [workspaces.id],
  }),
  keys: many(keysPermissions, {
    relationName: "permissions_keys_permissions_relations",
  }),
  roles: many(rolesPermissions, {
    relationName: "roles_permissions",
  }),
}));

export const keysPermissions = mysqlTable(
  "keys_permissions",
  {
    tempId: bigint("temp_id", { mode: "number" }).autoincrement().notNull(),
    keyId: varchar("key_id", { length: 256 }).notNull(),
    permissionId: varchar("permission_id", { length: 256 })
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
  },
  (table) => {
    return {
      keysPermissionsKeyIdPermissionIdWorkspaceId: primaryKey({
        columns: [table.keyId, table.permissionId, table.workspaceId],
        name: "keys_permissions_key_id_permission_id_workspace_id",
      }),
      keysPermissionsTempIdUnique: unique("keys_permissions_temp_id_unique").on(
        table.tempId,
      ),
      keyIdPermissionIdIdx: unique("key_id_permission_id_idx").on(
        table.keyId,
        table.permissionId,
      ),
    };
  },
);

export const keysPermissionsRelations = relations(
  keysPermissions,
  ({ one }) => ({
    key: one(keys, {
      fields: [keysPermissions.keyId],
      references: [keys.id],
      relationName: "keys_keys_permissions_relations",
    }),
    permission: one(permissions, {
      fields: [keysPermissions.permissionId],
      references: [permissions.id],
      relationName: "permissions_keys_permissions_relations",
    }),
  }),
);
export const roles = mysqlTable(
  "roles",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 512 }).notNull(),
    description: varchar("description", { length: 512 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
  },
  (table) => {
    return {
      workspaceIdIdx: index("workspace_id_idx").on(table.workspaceId),
      uniqueNamePerWorkspaceIdx: unique("unique_name_per_workspace_idx").on(
        table.name,
        table.workspaceId,
      ),
    };
  },
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [roles.workspaceId],
    references: [workspaces.id],
  }),
  keys: many(keysRoles, {
    relationName: "keys_roles_roles_relations",
  }),
  permissions: many(rolesPermissions, {
    relationName: "roles_rolesPermissions",
  }),
}));

export const rolesPermissions = mysqlTable(
  "roles_permissions",
  {
    roleId: varchar("role_id", { length: 256 })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: varchar("permission_id", { length: 256 })
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => {
    return {
      rolesPermissionsRoleIdPermissionIdWorkspaceId: primaryKey({
        columns: [table.roleId, table.permissionId, table.workspaceId],
        name: "roles_permissions_role_id_permission_id_workspace_id",
      }),
      uniqueTuplePermissionIdRoleId: unique(
        "unique_tuple_permission_id_role_id",
      ).on(table.permissionId, table.roleId),
    };
  },
);

export const rolesPermissionsRelations = relations(
  rolesPermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolesPermissions.roleId],
      references: [roles.id],
      relationName: "roles_rolesPermissions",
    }),
    permission: one(permissions, {
      fields: [rolesPermissions.permissionId],
      references: [permissions.id],
      relationName: "roles_permissions",
    }),
  }),
);

export const keysRoles = mysqlTable(
  "keys_roles",
  {
    keyId: varchar("key_id", { length: 256 })
      .notNull()
      .references(() => keys.id, { onDelete: "cascade" }),
    roleId: varchar("role_id", { length: 256 })
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
  },
  (table) => {
    return {
      keysRolesRoleIdKeyIdWorkspaceId: primaryKey({
        columns: [table.roleId, table.keyId, table.workspaceId],
        name: "keys_roles_role_id_key_id_workspace_id",
      }),
      uniqueKeyIdRoleId: uniqueIndex("unique_key_id_role_id").on(
        table.keyId,
        table.roleId,
      ),
    };
  },
);

export const keysRolesRelations = relations(keysRoles, ({ one }) => ({
  role: one(roles, {
    fields: [keysRoles.roleId],
    references: [roles.id],
    relationName: "keys_roles_roles_relations",
  }),
  key: one(keys, {
    fields: [keysRoles.keyId],
    references: [keys.id],
    relationName: "keys_roles_key_relations",
  }),
}));
