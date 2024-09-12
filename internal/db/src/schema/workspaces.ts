import type { Subscriptions } from "@internal/billing";
import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  json,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { apis } from "./apis";
import { gateways } from "./gateway";
import { keyAuth } from "./keyAuth";
import { keys } from "./keys";
import { llmGateways } from "./llm-gateway";
import { verificationMonitors } from "./monitor_verifications";
import { ratelimitNamespaces } from "./ratelimit";
import { permissions, roles } from "./rbac";
import { secrets } from "./secrets";
import { deleteProtection } from "./util/delete_protection";
import { vercelBindings, vercelIntegrations } from "./vercel_integration";
import { webhooks } from "./webhooks";

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: varchar("id", { length: 256 }).primaryKey(),
    // Coming from our auth provider clerk
    // This can be either a user_xxx or org_xxx id
    tenantId: varchar("tenant_id", { length: 256 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),

    createdAt: datetime("created_at", { fsp: 3 }),
    deletedAt: datetime("deleted_at", { fsp: 3 }),

    // different plans, this should only be used for visualisations in the ui
    plan: mysqlEnum("plan", ["free", "pro", "enterprise"]).default("free"),

    // stripe
    stripeCustomerId: varchar("stripe_customer_id", { length: 256 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 256 }),

    // null means there was no trial
    trialEnds: datetime("trial_ends", { fsp: 3 }),

    /**
     * feature flags
     *
     * betaFeatures may be toggled by the user for early access
     */
    betaFeatures: json("beta_features")
      .$type<{
        /**
         * Can access /app/authorization pages
         */
        rbac?: boolean;

        ratelimit?: boolean;
      }>()
      .notNull(),
    features: json("features")
      .$type<{
        /**
         * enable audit log retention by specifiying the number of days
         *
         * undefined should fall back to a default
         */
        auditLogRetentionDays?: number;

        /**
         * enable ratelimit retention by specifiying the number of days
         * undefined, 0 or negative means it's disabled
         */
        ratelimitRetentionDays?: number;

        /**
         * How many custom overrides a workspace may create.
         */
        ratelimitOverrides?: number;

        /**
         * Can access /app/success
         */
        successPage?: boolean;

        ipWhitelist?: boolean;
        webhooks?: boolean;
      }>()
      .notNull(),
    // prevent plan changes for a certain time, should be 1 day
    // deprecated, use planChanged
    planLockedUntil: datetime("plan_locked_until", { fsp: 3 }),
    /**
     * If a user requests to downgrade, we mark the workspace and downgrade it after the next
     * billing happened.
     */
    planDowngradeRequest: mysqlEnum("plan_downgrade_request", ["free"]),
    planChanged: datetime("plan_changed", { fsp: 3 }),
    subscriptions: json("subscriptions").$type<Subscriptions>(),
    /**
     * if the workspace is disabled, all API requests will be rejected
     */
    enabled: boolean("enabled").notNull().default(true),
    ...deleteProtection,
  },
  (table) => ({
    tenantIdIdx: uniqueIndex("tenant_id_idx").on(table.tenantId),
  }),
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  apis: many(apis),
  keys: many(keys, {
    relationName: "workspace_key_relation",
  }),
  vercelIntegrations: many(vercelIntegrations, {
    relationName: "vercel_workspace_relation",
  }),
  vercelBindings: many(vercelBindings, {
    relationName: "vercel_key_binding_relation",
  }),
  roles: many(roles),
  permissions: many(permissions),
  ratelimitNamespaces: many(ratelimitNamespaces),
  secrets: many(secrets),
  gateways: many(gateways),
  llmGateways: many(llmGateways),
  webhooks: many(webhooks),
  verificationMonitors: many(verificationMonitors),
  keySpaces: many(keyAuth),
}));
