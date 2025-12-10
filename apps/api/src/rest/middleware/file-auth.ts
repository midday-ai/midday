import { generateFileKey } from "@midday/encryption";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { normalizeAndValidatePath } from "../routers/files/utils";

export const withFileAuth: MiddlewareHandler = async (c, next) => {
  const fk = c.req.query("fk");

  if (!fk) {
    throw new HTTPException(401, {
      message: "File key (fk) query parameter is required for file access.",
    });
  }

  // Get filePath from query - this will be validated by the route schema
  const filePath = c.req.query("filePath") || c.req.query("path");

  if (!filePath) {
    throw new HTTPException(400, {
      message: "File path is required.",
    });
  }

  // Extract teamId from path
  const { pathTeamId } = normalizeAndValidatePath(filePath);

  // Generate expected key for this team
  const expectedKey = generateFileKey(pathTeamId);

  // Validate the provided key matches
  if (fk !== expectedKey) {
    throw new HTTPException(401, {
      message: "Invalid file key.",
    });
  }

  // Set teamId in context for downstream handlers
  c.set("teamId", pathTeamId);

  await next();
};
