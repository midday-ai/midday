import type { ZodError } from "zod";

import { BaseError } from "./base";

/**
 * An object does not have the required schema.
 */
export class SchemaError extends BaseError<{ raw: unknown }> {
  public readonly retry = false;
  public readonly name = SchemaError.name;

  constructor(opts: {
    message: string;
    context?: { raw: unknown };
    cause?: BaseError;
  }) {
    super({
      ...opts,
    });
  }
  static fromZod<T>(
    e: ZodError<T>,
    raw: unknown,
    context?: Record<string, unknown>,
  ): SchemaError {
    return new SchemaError({
      message: e.message,
      context: {
        raw: JSON.stringify(raw),
        ...context,
      },
    });
  }
}
