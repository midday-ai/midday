import { logger } from "@api/utils/logger";
import { HTTPException } from "hono/http-exception";
import type { ZodSchema } from "zod";

export const validateResponse = (data: any, schema: ZodSchema) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const cause = result.error.flatten();

    logger.error(cause);

    throw new HTTPException(400, {
      message: "Response validation failed",
      cause,
    });
  }
  return result.data;
};
