import { Err, Ok, SchemaError, type Result } from "@internal/error";

import { permissionQuerySchema, type PermissionQuery } from "./queries";

export class RBAC {
  public evaluatePermissions(
    q: PermissionQuery,
    permissions: string[]
  ): Result<
    { valid: true; message?: never } | { valid: false; message: string },
    SchemaError
  > {
    return this.evaluateQueryV1(q, permissions);
  }
  public validateQuery(q: PermissionQuery): Result<{ query: PermissionQuery }> {
    const validQuery = permissionQuerySchema.safeParse(q);
    if (!validQuery.success) {
      return Err(SchemaError.fromZod(validQuery.error, q));
    }

    return Ok({ query: validQuery.data });
  }

  private evaluateQueryV1(
    query: PermissionQuery,
    permissions: string[]
  ): Result<
    { valid: true; message?: never } | { valid: false; message: string },
    SchemaError
  > {
    if (typeof query === "string") {
      // Check if the permission is in the list of allowed permissions
      if (permissions.includes(query)) {
        return Ok({ valid: true });
      }
      return Ok({ valid: false, message: `Missing permission: '${query}'` });
    }

    if (query.and) {
      const results = query.and
        .filter(Boolean)
        .map((q) =>
          this.evaluateQueryV1(q as Required<PermissionQuery>, permissions)
        );
      for (const r of results) {
        if (r.err) {
          return r;
        }
        if (!r.val.valid) {
          return r;
        }
      }
      return Ok({ valid: true });
    }

    if (query.or) {
      for (const q of query.or) {
        const r = this.evaluateQueryV1(
          q as Required<PermissionQuery>,
          permissions
        );
        if (r.err) {
          return r;
        }
        if (r.val.valid) {
          return r;
        }
      }
      return Ok({
        valid: false,
        message: `Missing one of these permissions: [${query.or
          .filter(Boolean)
          .map((p) => `'${p}'`)
          .join(
            ", "
          )}], have: [${permissions.map((p) => `'${p}'`).join(", ")}]`,
      });
    }

    return Err(
      new SchemaError({ message: "reached end of evaluate and no match" })
    );
  }
}
