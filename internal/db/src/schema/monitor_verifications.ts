import { relations } from "drizzle-orm";
import { bigint, index, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { keyAuth } from "./keyAuth";
import { lifecycleDates } from "./util/lifecycle_dates";
import { webhooks } from "./webhooks";
import { workspaces } from "./workspaces";

export const verificationMonitors = mysqlTable(
  "usage_reporters",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    webhookId: varchar("webhook_id", { length: 256 })
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    keySpaceId: varchar("key_space_id", { length: 256 })
      .notNull()
      .references(() => keyAuth.id, { onDelete: "cascade" }),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    // milliseconds
    interval: bigint("interval", { mode: "number" }).notNull(),
    // unix milli timestamp representing a time up to which all usage has been collected
    // new invocations must not process data prior to this watermark
    highWaterMark: bigint("high_water_mark", { mode: "number" })
      .notNull()
      .default(0),
    nextExecution: bigint("next_execution", {
      mode: "number",
    }).notNull(),

    ...lifecycleDates,
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
  }),
);

export const verificationMonitorsRelations = relations(
  verificationMonitors,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [verificationMonitors.workspaceId],
      references: [workspaces.id],
    }),
    webhook: one(webhooks, {
      fields: [verificationMonitors.webhookId],
      references: [webhooks.id],
    }),
  }),
);
