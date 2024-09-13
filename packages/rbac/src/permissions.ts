/**
 * The database takes care of isolating roles between workspaces.
 * That's why we can assume the highest scope of a role is an `api` or later `gateway`
 *
 * role identifiers can look like this:
 * - `api_id.xxx`
 * - `gateway_id.xxx`
 *
 */

import { z } from "zod";

import type { Flatten } from "./types";

export function buildIdSchema(prefix: string) {
  return z.string().refine((s) => {
    if (s === "*") {
      return true;
    }
    const regex = new RegExp(
      `^${prefix}_[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{8,32}$`,
    );
    return regex.test(s);
  });
}
const apiId = buildIdSchema("api");
const ratelimitNamespaceId = buildIdSchema("rl");
const rbacId = buildIdSchema("rbac");
const identityEnvId = z.string();

export const apiActions = z.enum([
  "read_api",
  "create_api",
  "delete_api",
  "update_api",
  "create_key",
  "update_key",
  "delete_key",
  "encrypt_key",
  "decrypt_key",
  "read_key",
]);

export const ratelimitActions = z.enum([
  "limit",
  "create_namespace",
  "read_namespace",
  "update_namespace",
  "delete_namespace",
]);

export const rbacActions = z.enum([
  "create_permission",
  "update_permission",
  "delete_permission",
  "read_permission",
  "create_role",
  "update_role",
  "delete_role",
  "read_role",
  "add_permission_to_key",
  "remove_permission_from_key",
  "add_role_to_key",
  "remove_role_from_key",
  "add_permission_to_role",
  "remove_permission_from_role",
]);

export const identityActions = z.enum([
  "create_identity",
  "read_identity",
  "update_identity",
  "delete_identity",
]);

export type Resources = {
  [resourceId in `api.${z.infer<typeof apiId>}`]: z.infer<typeof apiActions>;
} & {
  [resourceId in `ratelimit.${z.infer<typeof ratelimitNamespaceId>}`]: z.infer<
    typeof ratelimitActions
  >;
} & {
  [resourceId in `rbac.${z.infer<typeof rbacId>}`]: z.infer<typeof rbacActions>;
} & {
  [resourceId in `identity.${z.infer<typeof identityEnvId>}`]: z.infer<
    typeof identityActions
  >;
};

export type UnkeyPermission = Flatten<Resources> | "*";

/**
 * Validation for roles used for our root keys
 */
export const unkeyPermissionValidation = z
  .custom<UnkeyPermission>()
  .refine((s) => {
    z.string().parse(s);
    if (s === "*") {
      /**
       * This is a legacy role granting access to everything
       */
      return true;
    }
    const split = s.split(".");
    if (split.length !== 3) {
      return false;
    }
    const [resource, id, action] = split;
    switch (resource) {
      case "api": {
        return (
          apiId.safeParse(id).success && apiActions.safeParse(action).success
        );
      }
      case "ratelimit": {
        return (
          ratelimitNamespaceId.safeParse(id).success &&
          ratelimitActions.safeParse(action).success
        );
      }
      case "rbac": {
        return (
          rbacId.safeParse(id).success && rbacActions.safeParse(action).success
        );
      }
      case "identity": {
        return (
          identityEnvId.safeParse(id).success &&
          identityActions.safeParse(action).success
        );
      }

      default: {
        return false;
      }
    }
  });
