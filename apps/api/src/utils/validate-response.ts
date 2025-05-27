import { logger } from "@api/utils/logger";
import type { ZodSchema } from "zod";

export const validateResponse = (data: any, schema: ZodSchema) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const cause = result.error.flatten();

    logger.error(cause);

    return {
      success: false,
      error: "Response validation failed",
      details: cause,
      data: null,
    };
  }

  return result.data;
};
