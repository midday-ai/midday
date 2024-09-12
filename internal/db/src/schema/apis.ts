import { relations } from "drizzle-orm";
import {
  datetime,
  index,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

import { keyAuth } from "./keyAuth";
import { deleteProtection } from "./util/delete_protection";
import { workspaces } from "./workspaces";

export const apis = mysqlTable(
  "apis",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /**
     * comma separated ips
     */
    ipWhitelist: varchar("ip_whitelist", { length: 512 }),
    authType: mysqlEnum("auth_type", ["key", "jwt"]),
    keyAuthId: varchar("key_auth_id", { length: 256 }).unique(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),

    ...deleteProtection,
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
  }),
);

export const apisRelations = relations(apis, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [apis.workspaceId],
    references: [workspaces.id],
  }),
  keyAuth: one(keyAuth, {
    fields: [apis.keyAuthId],
    references: [keyAuth.id],
  }),
}));
