import type { Context } from "@api/rest/types";
import type { Handler, Context as HonoContext } from "hono";
import type { z } from "zod";

type SchemaWithTransforms = {
  transformInput: (input: unknown) => any;
  transformOutput: <T>(data: T) => any;
  camel?: z.ZodTypeAny;
};

type TransformConfig = {
  input?: SchemaWithTransforms;
  output?: SchemaWithTransforms;
  inputSource?: "query" | "json" | "param";
};

/**
 * Higher-order function that wraps a route handler to automatically handle
 * input transformation and output transformation using schemas.
 * Pre-typed with the custom Context type.
 *
 * @param config - Object with optional input/output schemas and input source
 * @param handler - The route handler function
 * @returns A wrapped handler with automatic transforms
 */

// Most specific: When input has camel property (from createSchema), extract the type
export function withTransform<TInput extends z.ZodTypeAny>(
  config: {
    input: {
      camel: TInput;
      snake: z.ZodTypeAny;
      transformInput: (input: unknown) => any;
      transformOutput: <T>(data: T) => any;
    };
    output?: SchemaWithTransforms;
    inputSource?: "query" | "json" | "param";
  },
  handler: (
    c: HonoContext<Context>,
    transformedInput: z.infer<TInput>,
  ) => Promise<any>,
): Handler<Context>;

// When no input schema is provided
export function withTransform(
  config: {
    input?: never;
    output?: SchemaWithTransforms;
    inputSource?: "query" | "json" | "param";
  },
  handler: (c: HonoContext<Context>) => Promise<any>,
): Handler<Context>;

// Fallback for other cases
export function withTransform(
  config: TransformConfig,
  handler: (c: HonoContext<Context>, transformedInput?: any) => Promise<any>,
): Handler<Context>;

// Implementation
export function withTransform(
  config: TransformConfig,
  handler: (c: HonoContext<Context>, transformedInput?: any) => Promise<any>,
): Handler<Context> {
  return async (c: HonoContext<Context>) => {
    let transformedInput: any;

    // Handle input transformation if input schema is provided
    if (config.input) {
      const inputSource = config.inputSource || "query";
      let rawInput: any;

      switch (inputSource) {
        case "json":
          rawInput = (c.req as any).valid("json") || {};
          break;
        case "param":
          rawInput = (c.req as any).valid("param") || {};
          break;
        default:
          rawInput = (c.req as any).valid("query") || {};
          break;
      }

      transformedInput = config.input.transformInput(rawInput);
    }

    // Execute the handler
    const result = await handler(c, transformedInput);

    // If the handler already returned a Response, return it as-is
    if (result instanceof Response) {
      return result;
    }

    // Handle output transformation if output schema is provided
    if (config.output) {
      let filteredResult = result;

      // Filter result to only include fields defined in the schema if camel schema is available
      if (config.output.camel) {
        // Try to parse with the schema to filter out extra fields
        const parseResult = config.output.camel.safeParse(result);
        if (parseResult.success) {
          filteredResult = parseResult.data;
        } else {
          // If parsing fails, try with passthrough to allow extra fields
          const passthroughResult = config.output.camel.safeParse(result);
          if (passthroughResult.success) {
            filteredResult = passthroughResult.data;
          }
          // If both fail, use original result as fallback
        }
      }

      const transformedResult = config.output.transformOutput(filteredResult);
      return c.json(transformedResult);
    }

    // No output transformation, just return as JSON
    return c.json(result);
  };
}
