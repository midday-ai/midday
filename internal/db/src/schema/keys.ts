import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { identities, ratelimits } from "./identity";
import { keyAuth } from "./keyAuth";
import { keysPermissions, keysRoles } from "./rbac";
import { embeddedEncrypted } from "./util/embedded_encrypted";
import { lifecycleDatesMigration } from "./util/lifecycle_dates";
import { workspaces } from "./workspaces";

export const keys = mysqlTable(
  "keys",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    keyAuthId: varchar("key_auth_id", { length: 256 })
      .notNull()
      .references(() => keyAuth.id, { onDelete: "cascade" }),
    hash: varchar("hash", { length: 256 }).notNull(),
    start: varchar("start", { length: 256 }).notNull(),

    /**
     * This is the workspace that owns the key.
     */
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    /**
     * For internal keys, this is the workspace that the key is for.
     * The owning workspace is an internal one, defined in env.UNKEY_WORKSPACE_ID
     * However in order to filter and display the keys in the UI, we need to know which user/org
     * the key is for.
     *
     * This field is not used for user keys, only for the internal keys that are used to manage the unkey app itself.
     */
    forWorkspaceId: varchar("for_workspace_id", { length: 256 }),
    name: varchar("name", { length: 256 }),
    ownerId: varchar("owner_id", { length: 256 }),
    identityId: varchar("identity_id", { length: 256 }),
    meta: text("meta"),
    createdAt: datetime("created_at", { fsp: 3 }).notNull(), // unix milli
    expires: datetime("expires", { fsp: 3 }), // unix milli,
    ...lifecycleDatesMigration,
    /**
     * When a key is revoked, we set this time field to mark it as deleted.
     *
     * All places where we show keys, should filter by this field.
     *
     * `deletedAt == null` means the key is active.
     */
    deletedAt: datetime("deleted_at", { fsp: 3 }),
    /**
     * You can refill uses to keys at a desired interval
     */
    refillInterval: mysqlEnum("refill_interval", ["daily", "monthly"]),
    refillAmount: int("refill_amount"),
    lastRefillAt: datetime("last_refill_at", { fsp: 3 }),
    /**
     * sets if key is enabled or disabled
     */
    enabled: boolean("enabled").default(true).notNull(),

    /**
     * You can limit the amount of times a key can be verified before it becomes invalid
     */

    remaining: int("remaining_requests"),
    ratelimitAsync: boolean("ratelimit_async"),
    ratelimitLimit: int("ratelimit_limit"), // max size of the bucket
    ratelimitDuration: bigint("ratelimit_duration", { mode: "number" }), // milliseconds
    /**
     * A custom environment flag for our users to divide keys.
     * For example stripe has `live` and `test` keys.
     *
     * This field is an optional string on purpose, we do not make any assumptions at this level.
     * A schema for enums or other enforcements should happen at the keyAuth level instead, where
     * common settings can be configured by the user.
     */
    environment: varchar("environment", { length: 256 }),
  },
  (table) => ({
    hashIndex: uniqueIndex("hash_idx").on(table.hash),
    keyAuthAndDeletedIndex: index("key_auth_id_deleted_at_idx").on(
      table.keyAuthId,
      table.deletedAt,
    ),
    forWorkspaceIdIndex: index("idx_keys_on_for_workspace_id").on(
      table.forWorkspaceId,
    ),
    ownerIdIndex: index("owner_id_idx").on(table.ownerId),
  }),
);

export const keysRelations = relations(keys, ({ one, many }) => ({
  keyAuth: one(keyAuth, {
    fields: [keys.keyAuthId],
    references: [keyAuth.id],
  }),
  workspace: one(workspaces, {
    relationName: "workspace_key_relation",
    fields: [keys.workspaceId],
    references: [workspaces.id],
  }),

  forWorkspace: one(workspaces, {
    fields: [keys.forWorkspaceId],
    references: [workspaces.id],
  }),
  permissions: many(keysPermissions, {
    relationName: "keys_keys_permissions_relations",
  }),
  roles: many(keysRoles, {
    relationName: "keys_roles_key_relations",
  }),
  encrypted: one(encryptedKeys),
  ratelimits: many(ratelimits),
  identity: one(identities, {
    fields: [keys.identityId],
    references: [identities.id],
  }),
}));

/**
 * Not every key will be available to be retrieved. However if a key is configured to be encrypted
 * we add a row in this table and link it back to the `keys` table.
 */
export const encryptedKeys = mysqlTable(
  "encrypted_keys",
  {
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    keyId: varchar("key_id", { length: 256 })
      .notNull()
      .references(() => keys.id, { onDelete: "cascade" }),

    ...embeddedEncrypted,
  },
  (table) => ({
    onePerKey: uniqueIndex("key_id_idx").on(table.keyId),
  }),
);

export const encryptedKeysRelations = relations(encryptedKeys, ({ one }) => ({
  key: one(keys, {
    fields: [encryptedKeys.keyId],
    references: [keys.id],
  }),
  workspace: one(workspaces, {
    fields: [encryptedKeys.workspaceId],
    references: [workspaces.id],
  }),
}));
