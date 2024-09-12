import type { InferSelectModel } from "drizzle-orm";

import type * as schema from "./schema";

export type Key = InferSelectModel<typeof schema.keys>;
export type Api = InferSelectModel<typeof schema.apis>;
export type Workspace = InferSelectModel<typeof schema.workspaces>;
export type KeyAuth = InferSelectModel<typeof schema.keyAuth>;
export type VercelIntegration = InferSelectModel<
  typeof schema.vercelIntegrations
>;
export type VercelBinding = InferSelectModel<typeof schema.vercelBindings>;
export type Permission = InferSelectModel<typeof schema.permissions>;
export type Role = InferSelectModel<typeof schema.roles>;
export type RatelimitOverride = InferSelectModel<
  typeof schema.ratelimitOverrides
>;
export type RatelimitNamespace = InferSelectModel<
  typeof schema.ratelimitNamespaces
>;
export type Secret = InferSelectModel<typeof schema.secrets>;
export type VerificationMonitor = InferSelectModel<
  typeof schema.verificationMonitors
>;
export type Webhook = InferSelectModel<typeof schema.webhooks>;
export type Event = InferSelectModel<typeof schema.events>;
export type EncryptedKey = InferSelectModel<typeof schema.encryptedKeys>;
export type KeyRole = InferSelectModel<typeof schema.keysRoles>;
export type KeyPermission = InferSelectModel<typeof schema.keysPermissions>;
export type Ratelimit = InferSelectModel<typeof schema.ratelimits>;
export type Identity = InferSelectModel<typeof schema.identities>;
