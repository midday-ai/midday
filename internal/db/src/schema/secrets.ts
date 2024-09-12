import { relations } from "drizzle-orm";
import { mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

import { embeddedEncrypted } from "./util/embedded_encrypted";
import { lifecycleDates } from "./util/lifecycle_dates";
import { workspaces } from "./workspaces";

export const secrets = mysqlTable(
  "secrets",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    name: varchar("name", { length: 256 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    ...embeddedEncrypted,
    ...lifecycleDates,
    comment: varchar("comment", { length: 256 }),
  },
  (table) => ({
    uniqueNamePerWorkspace: uniqueIndex("unique_workspace_id_name_idx").on(
      table.workspaceId,
      table.name,
    ),
  }),
);

export const secretsRelations = relations(secrets, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [secrets.workspaceId],
    references: [workspaces.id],
  }),
}));
