import { relations } from "drizzle-orm";
import { bigint, json, mysqlTable, varchar } from "drizzle-orm/mysql-core";

import { workspaces } from "./workspaces";

export const keyMigrationErrors = mysqlTable("key_migration_errors", {
  id: varchar("id", { length: 256 }).primaryKey(),
  migrationId: varchar("migration_id", { length: 256 }).notNull(),
  createdAt: bigint("created_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),

  workspaceId: varchar("workspace_id", { length: 256 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),

  message: json("message")
    .$type<{
      migrationId: string;
      workspaceId: string;
      keyAuthId: string;
      rootKeyId: string;
      prefix?: string;

      name?: string;
      hash: string;
      start?: string;
      ownerId?: string;
      meta?: Record<string, unknown>;
      roles?: string[];
      permissions?: string[];
      expires?: number;
      remaining?: number;
      refill?: { interval: "daily" | "monthly"; amount: number };
      ratelimit?: { async: boolean; limit: number; duration: number };
      enabled: boolean;
      environment?: string;
      encrypted?: {
        encrypted: string;
        keyId: string;
      };

      auditLogContext: {
        location: string;
        userAgent: string;
      };
    }>()
    .notNull(),
});

export const keyMigrationErrorsRelations = relations(
  keyMigrationErrors,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [keyMigrationErrors.workspaceId],
      references: [workspaces.id],
    }),
  }),
);
