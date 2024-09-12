import { relations } from "drizzle-orm";
import { datetime, index, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { secrets } from "./secrets";
import { workspaces } from "./workspaces";

export const gateways = mysqlTable(
  "gateways",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    name: varchar("name", { length: 128 }).unique().notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    origin: varchar("origin", { length: 256 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).$default(
      () => new Date(),
    ),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
  }),
);

export const gatewaysRelations = relations(gateways, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [gateways.workspaceId],
    references: [workspaces.id],
  }),
  headerRewrites: many(gatewayHeaderRewrites),
}));

export const gatewayHeaderRewrites = mysqlTable(
  "gateway_header_rewrites",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    secretId: varchar("secret_id", { length: 256 }).notNull(),

    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    gatewayId: varchar("gateways_id", { length: 256 })
      .notNull()
      .references(() => gateways.id, { onDelete: "cascade" }),

    createdAt: datetime("created_at", { mode: "date", fsp: 3 }).$default(
      () => new Date(),
    ),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
  }),
);

export const gatewayHeaderRewritesRelations = relations(
  gatewayHeaderRewrites,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [gatewayHeaderRewrites.workspaceId],
      references: [workspaces.id],
    }),
    proxy: one(gateways, {
      fields: [gatewayHeaderRewrites.gatewayId],
      references: [gateways.id],
    }),
    secret: one(secrets, {
      fields: [gatewayHeaderRewrites.secretId],
      references: [secrets.id],
    }),
  }),
);
