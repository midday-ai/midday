import { z } from "zod";

import type { unkeyPermissionValidation } from "./permissions";

type Rule = "and" | "or";

export type PermissionQuery<R extends string = string> =
  | R
  | {
      and: Array<PermissionQuery<R> | undefined>;
      or?: never;
    }
  | {
      and?: never;
      or: Array<PermissionQuery<R> | undefined>;
    };

export const permissionQuerySchema: z.ZodType<PermissionQuery> = z.union([
  z.string(),
  z.object({
    and: z
      .array(z.lazy(() => permissionQuerySchema))
      .min(1, "provide at least one permission"),
  }),
  z.object({
    or: z
      .array(z.lazy(() => permissionQuerySchema))
      .min(1, "provide at least one permission"),
  }),
]);

function merge<R extends string>(
  rule: Rule,
  ...args: Array<PermissionQuery<R> | undefined>
): PermissionQuery<R> {
  return args.filter(Boolean).reduce((acc: PermissionQuery<R>, arg) => {
    if (typeof acc === "string") {
      throw new Error("Cannot merge into a string");
    }
    if (!acc[rule]) {
      acc[rule] = [];
    }
    acc[rule]!.push(arg);
    return acc;
  }, {} as PermissionQuery<R>);
}

export function or<R extends string = string>(
  ...args: Array<PermissionQuery<R> | undefined>
): PermissionQuery<R> {
  return merge("or", ...args);
}

export function and<R extends string = string>(
  ...args: Array<PermissionQuery<R> | undefined>
): PermissionQuery<R> {
  return merge("and", ...args);
}
export function buildQuery<R extends string = string>(
  fn: (ops: { or: typeof or<R>; and: typeof and<R> }) => PermissionQuery<R>,
): PermissionQuery {
  return fn({ or, and });
}

/**
 * buildUnkeyQuery is preloaded with out available roles and ensures typesafety for root key validation
 */
export const buildUnkeyQuery = buildQuery<
  z.infer<typeof unkeyPermissionValidation>
>;
