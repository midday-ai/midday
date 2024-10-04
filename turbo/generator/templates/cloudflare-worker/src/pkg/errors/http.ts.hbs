import { z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import type { ZodError } from "zod";
import type { HonoEnv } from "../hono/env";
import { parseZodErrorMessage } from "../util/zod-error";

const ErrorCode = z.enum([
  "BAD_REQUEST",
  "FORBIDDEN",
  "INTERNAL_SERVER_ERROR",
  "USAGE_EXCEEDED",
  "DISABLED",
  "NOT_FOUND",
  "NOT_UNIQUE",
  "RATE_LIMITED",
  "UNAUTHORIZED",
  "PRECONDITION_FAILED",
  "INSUFFICIENT_PERMISSIONS",
  "METHOD_NOT_ALLOWED",
  "EXPIRED",
  "DELETE_PROTECTED",
]);

export function errorSchemaFactory(code: z.ZodEnum<any>) {
  return z.object({
    error: z.object({
      code: code.openapi({
        description: "A machine readable error code.",
        example: code._def.values.at(0),
      }),
      docs: z.string().openapi({
        description:
          "A link to our documentation with more details about this error code",
        example: `https://unkey.dev/docs/api-reference/errors/code/${code._def.values.at(0)}`,
      }),
      message: z.string().openapi({
        description: "A human readable explanation of what went wrong",
      }),
      requestId: z.string().openapi({
        description: "Please always include the requestId in your error report",
        example: "req_1234",
      }),
    }),
  });
}

export const ErrorSchema = z.object({
  error: z.object({
    code: ErrorCode.openapi({
      description: "A machine readable error code.",
      example: "INTERNAL_SERVER_ERROR",
    }),
    docs: z.string().openapi({
      description:
        "A link to our documentation with more details about this error code",
      example: "https://unkey.dev/docs/api-reference/errors/code/BAD_REQUEST",
    }),
    message: z.string().openapi({
      description: "A human readable explanation of what went wrong",
    }),
    requestId: z.string().openapi({
      description: "Please always include the requestId in your error report",
      example: "req_1234",
    }),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorSchema>;

function codeToStatus(code: z.infer<typeof ErrorCode>): StatusCode {
  switch (code) {
    case "BAD_REQUEST":
      return 400;
    case "FORBIDDEN":
    case "DISABLED":
    case "UNAUTHORIZED":
    case "INSUFFICIENT_PERMISSIONS":
    case "USAGE_EXCEEDED":
    case "EXPIRED":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "METHOD_NOT_ALLOWED":
      return 405;
    case "NOT_UNIQUE":
      return 409;
    case "DELETE_PROTECTED":
    case "PRECONDITION_FAILED":
      return 412;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL_SERVER_ERROR":
      return 500;
  }
}

function statusToCode(status: StatusCode): z.infer<typeof ErrorCode> {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";

    case 404:
      return "NOT_FOUND";

    case 405:
      return "METHOD_NOT_ALLOWED";
    case 500:
      return "INTERNAL_SERVER_ERROR";
    default:
      return "INTERNAL_SERVER_ERROR";
  }
}

export class ServiceAPIError extends HTTPException {
  public readonly code: z.infer<typeof ErrorCode>;

  constructor({
    code,
    message,
  }: {
    code: z.infer<typeof ErrorCode>;
    message: string;
  }) {
    super(codeToStatus(code), { message });
    this.code = code;
  }
}

export class DatabaseError extends ServiceAPIError {
  public readonly code: z.infer<typeof ErrorCode>;
  constructor({
    code,
    message,
  }: {
    code: z.infer<typeof ErrorCode>;
    message: string;
  }) {
    super({ code, message });
    this.code = code;
  }
}

export class QueryError extends ServiceAPIError {
  public readonly code: z.infer<typeof ErrorCode>;
  constructor({
    code,
    message,
  }: {
    code: z.infer<typeof ErrorCode>;
    message: string;
  }) {
    super({ code, message });
    this.code = code;
  }
}

export class TransactionError extends ServiceAPIError {
  public readonly code: z.infer<typeof ErrorCode>;
  constructor({
    code,
    message,
  }: {
    code: z.infer<typeof ErrorCode>;
    message: string;
  }) {
    super({ code, message });
    this.code = code;
  }
}

export function handleZodError(
  result:
    | {
        success: true;
        data: any;
      }
    | {
        success: false;
        error: ZodError;
      },
  c: Context,
) {
  if (!result.success) {
    return c.json<z.infer<typeof ErrorSchema>>(
      {
        error: {
          code: "BAD_REQUEST",
          docs: "https://unkey.dev/docs/api-reference/errors/code/BAD_REQUEST",
          message: parseZodErrorMessage(result.error),
          requestId: c.get("requestId"),
        },
      },
      { status: 400 },
    );
  }
}

export function handleError(err: Error, c: Context<HonoEnv>): Response {
  const { logger } = c.get("services");

  /**
   * We can handle this very well, as it is something we threw ourselves
   */
  if (
    err instanceof ServiceAPIError ||
    err instanceof DatabaseError ||
    err instanceof QueryError ||
    err instanceof TransactionError
  ) {
    if (err.status >= 500) {
      logger.error("returning 5XX", {
        message: err.message,
        name: err.name,
        code: err.code,
        status: err.status,
      });
    }
    return c.json<z.infer<typeof ErrorSchema>>(
      {
        error: {
          code: err.code,
          docs: `https://unkey.dev/docs/api-reference/errors/code/${err.code}`,
          message: err.message,
          requestId: c.get("requestId"),
        },
      },
      { status: err.status },
    );
  }

  /**
   * HTTPExceptions from hono at least give us some idea of what to do as they provide a status and
   * message
   */
  if (err instanceof HTTPException) {
    if (err.status >= 500) {
      logger.error("HTTPException", {
        message: err.message,
        status: err.status,
        requestId: c.get("requestId"),
      });
    }
    const code = statusToCode(err.status);
    return c.json<z.infer<typeof ErrorSchema>>(
      {
        error: {
          code,
          docs: `https://unkey.dev/docs/api-reference/errors/code/${code}`,
          message: err.message,
          requestId: c.get("requestId"),
        },
      },
      { status: err.status },
    );
  }

  /**
   * We're lost here, all we can do is return a 500 and log it to investigate
   */
  logger.error("unhandled exception", {
    name: err.name,
    message: err.message,
    cause: err.cause,
    stack: err.stack,
    requestId: c.get("requestId"),
  });
  return c.json<z.infer<typeof ErrorSchema>>(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        docs: "https://unkey.dev/docs/api-reference/errors/code/INTERNAL_SERVER_ERROR",
        message: err.message ?? "something unexpected happened",
        requestId: c.get("requestId"),
      },
    },
    { status: 500 },
  );
}

export function errorResponse(
  c: Context,
  code: z.infer<typeof ErrorCode>,
  message: string,
) {
  return c.json<z.infer<typeof ErrorSchema>>(
    {
      error: {
        code: code,
        docs: `https://unkey.dev/docs/api-reference/errors/code/${code}`,
        message,
        requestId: c.get("requestId"),
      },
    },
    { status: codeToStatus(code) },
  );
}
