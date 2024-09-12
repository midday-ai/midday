import { eventTypesArr, type Event } from "@internal/events";
import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

import { embeddedEncrypted } from "./util/embedded_encrypted";
import { lifecycleDates } from "./util/lifecycle_dates";
import { workspaces } from "./workspaces";

export const webhooks = mysqlTable(
  "webhooks",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    destination: varchar("destination", { length: 256 }).notNull(),
    workspaceId: varchar("workspace_id", { length: 256 })
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(true),

    ...lifecycleDates,
    ...embeddedEncrypted,
  },
  (table) => ({
    workspaceId: index("workspace_id_idx").on(table.workspaceId),
  }),
);

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [webhooks.workspaceId],
    references: [workspaces.id],
  }),
  events: many(events),
}));

export const events = mysqlTable("events", {
  id: varchar("id", { length: 256 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 256 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  webhookId: varchar("webhook_id", { length: 256 })
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  event: mysqlEnum("event", eventTypesArr).notNull(),
  time: bigint("time", { mode: "number" }).notNull(),
  payload: json("payload").$type<Event>().notNull(),
  state: mysqlEnum("state", ["created", "retrying", "delivered", "failed"])
    .notNull()
    .default("created"),
  ...lifecycleDates,
});

export const eventsRelations = relations(events, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [events.workspaceId],
    references: [workspaces.id],
  }),
  webhook: one(webhooks, {
    fields: [events.webhookId],
    references: [webhooks.id],
  }),
  deliveryAttempts: many(deliveryAttempts),
}));

export const deliveryAttempts = mysqlTable("webhook_delivery_attempts", {
  id: varchar("id", { length: 256 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 256 })
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  webhookId: varchar("webhook_id", { length: 256 })
    .notNull()
    .references(() => webhooks.id, { onDelete: "cascade" }),
  eventId: varchar("event_id", { length: 256 })
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),

  time: bigint("time", { mode: "number" }).notNull(),
  attempt: int("attempt").notNull(),
  nextAttemptAt: bigint("next_attempt_at", { mode: "number" }),
  success: boolean("success").notNull(),
  internalError: varchar("internal_error", { length: 512 }),
  responseStatus: int("response_status"),
  responseBody: varchar("response_body", { length: 1000 }),
});

export const deliveryAttemptsRelations = relations(
  deliveryAttempts,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [deliveryAttempts.workspaceId],
      references: [workspaces.id],
    }),
    webhook: one(webhooks, {
      fields: [deliveryAttempts.webhookId],
      references: [webhooks.id],
    }),
    event: one(events, {
      fields: [deliveryAttempts.eventId],
      references: [events.id],
    }),
  }),
);
