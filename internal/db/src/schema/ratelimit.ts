import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  int,
  mysqlEnum,
  mysqlTable,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";

import { workspaces } from "./workspaces";

export const ratelimitNamespaces = mysqlTable(
  "ratelimit_namespaces",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 512 }).notNull(),
    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
    deletedAt: datetime("deleted_at", { mode: "date" }),
  },
  (table) => {
    return {
      uniqueNamePerWorkspaceIdx: unique("unique_name_per_workspace_idx").on(
        table.name,
        table.workspaceId,
      ),
    };
  },
);

export const ratelimitNamespaceRelations = relations(
  ratelimitNamespaces,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [ratelimitNamespaces.workspaceId],
      references: [workspaces.id],
    }),
    overrides: many(ratelimitOverrides),
  }),
);

export const ratelimitOverrides = mysqlTable(
  "ratelimit_overrides",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    namespaceId: varchar("namespace_id", { length: 256 })
      .notNull()
      .references(() => ratelimitNamespaces.id, { onDelete: "cascade" }),
    identifier: varchar("identifier", { length: 512 }).notNull(),

    limit: int("limit").notNull(),
    /**
     * window duration in milliseconds
     */
    duration: int("duration").notNull(),
    /**
     * If true, don't wait for the origin to return, use cached values instead.
     */
    async: boolean("async"),

    /**
     * Sharding method used.
     *
     * - edge: use the worker's edge location as part of the DO id, to run local objects
     */
    sharding: mysqlEnum("sharding", ["edge"]),

    createdAt: datetime("created_at", { mode: "date", fsp: 3 })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: datetime("updated_at", { mode: "date", fsp: 3 }),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
  },
  (table) => {
    return {
      uniqueIdentifierPerNamespace: unique(
        "unique_identifier_per_namespace_idx",
      ).on(table.identifier, table.namespaceId),
    };
  },
);
export const ratelimitOverridesRelations = relations(
  ratelimitOverrides,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [ratelimitOverrides.workspaceId],
      references: [workspaces.id],
    }),
    namespace: one(ratelimitNamespaces, {
      fields: [ratelimitOverrides.namespaceId],
      references: [ratelimitNamespaces.id],
    }),
  }),
);
