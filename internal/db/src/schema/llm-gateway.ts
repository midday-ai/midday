import { relations } from "drizzle-orm";
import { index, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { lifecycleDates } from "./util/lifecycle_dates";
import { workspaces } from "./workspaces";

export const llmGateways = mysqlTable(
  "llm_gateways",
  {
    id: varchar("id", { length: 256 }).primaryKey(),

    /**
     * User space name for the gateway, don't use this for anything but display purposes
     */
    name: varchar("name", { length: 128 }).notNull(),
    subdomain: varchar("subdomain", { length: 128 }).unique().notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    ...lifecycleDates,
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
  }),
);

export const llmGatewaysRelations = relations(llmGateways, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [llmGateways.workspaceId],
    references: [workspaces.id],
  }),
}));
