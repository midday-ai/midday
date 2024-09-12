import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  int,
  json,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { keys } from "./keys";
import { lifecycleDates } from "./util/lifecycle_dates";
import { workspaces } from "./workspaces";

export const identities = mysqlTable(
  "identities",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    /**
     * The extenral id is used to create a reference to the user's existing data.
     * They likely have an organization or user id at hand
     */
    externalId: varchar("external_id", { length: 256 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    environment: varchar("environment", { length: 256 })
      .notNull()
      .default("default"),
    ...lifecycleDates,
    meta: json("meta").$type<Record<string, unknown>>(),
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
    uniqueExternalIdPerWorkspace: uniqueIndex(
      "external_id_workspace_id_idx",
    ).on(table.externalId, table.workspaceId),
  }),
);

export const identitiesRelations = relations(identities, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [identities.workspaceId],
    references: [workspaces.id],
  }),
  keys: many(keys),
  ratelimits: many(ratelimits),
}));

/**
 * Ratelimits can be attached to a key or identity and will be referenced by the name
 */
export const ratelimits = mysqlTable(
  "ratelimits",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    /**
     * The name is used to reference this limit when verifying a key.
     */
    name: varchar("name", { length: 256 }).notNull(),

    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    ...lifecycleDates,
    /**
     * Either keyId or identityId may be defined, not both
     */
    keyId: varchar("key_id", { length: 256 }).references(() => keys.id, {
      onDelete: "cascade",
    }),
    /**
     * Either keyId or identityId may be defined, not both
     */
    identityId: varchar("identity_id", { length: 256 }).references(
      () => identities.id,
      {
        onDelete: "cascade",
      },
    ),
    limit: int("limit").notNull(),
    // milliseconds
    duration: bigint("duration", { mode: "number" }).notNull(),
  },
  (table) => ({
    nameIdx: index("name_idx").on(table.name),
    uniqueName: uniqueIndex("unique_name_idx").on(
      table.name,
      table.keyId,
      table.identityId,
    ),
  }),
);

export const ratelimitRelations = relations(ratelimits, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [ratelimits.workspaceId],
    references: [workspaces.id],
  }),
  keys: one(keys, {
    fields: [ratelimits.keyId],
    references: [keys.id],
  }),
  identities: one(identities, {
    fields: [ratelimits.identityId],
    references: [identities.id],
  }),
}));
