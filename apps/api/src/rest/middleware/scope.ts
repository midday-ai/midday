import type { Scope } from "@api/utils/scopes";
import type { MiddlewareHandler } from "hono";

export const withRequiredScope = (
  ...requiredScopes: Scope[]
): MiddlewareHandler => {
  return async (c, next) => {
    const scopes = c.get("scopes") as Scope[] | undefined;

    if (!scopes) {
      return c.json(
        {
          error: "Unauthorized",
          description:
            "No scopes found for the current user. Authentication is required.",
        },
        401,
      );
    }

    // Check if user has at least one of the required scopes
    const hasRequiredScope = requiredScopes.some((requiredScope) =>
      scopes.includes(requiredScope),
    );

    if (!hasRequiredScope) {
      return c.json(
        {
          error: "Forbidden",
          description: `Insufficient permissions. Required scopes: ${requiredScopes.join(
            ", ",
          )}. Your scopes: ${scopes.join(", ")}`,
        },
        403,
      );
    }

    await next();
  };
};
