import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import { type ZodRawShape, type ZodTypeAny, z } from "zod";

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformSchemaToSnakeCase(schema: ZodTypeAny): ZodTypeAny {
  // Handle ZodObject - recursively transform nested objects
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const snakeShape: Record<string, ZodTypeAny> = {};

    for (const [key, value] of Object.entries(shape)) {
      const snakeKey = toSnakeCase(key);
      snakeShape[snakeKey] = transformSchemaToSnakeCase(value as ZodTypeAny);
    }

    return z.object(snakeShape);
  }

  // Handle ZodArray - transform the element type if it's an object
  if (schema instanceof z.ZodArray) {
    return z.array(transformSchemaToSnakeCase(schema.element));
  }

  // Handle ZodOptional - unwrap, transform, and make optional again
  if (schema instanceof z.ZodOptional) {
    return transformSchemaToSnakeCase(schema.unwrap()).optional();
  }

  // Handle ZodNullable - unwrap, transform, and make nullable again
  if (schema instanceof z.ZodNullable) {
    return transformSchemaToSnakeCase(schema.unwrap()).nullable();
  }

  // For primitive types and other schemas, return as is
  return schema;
}

export function createSchema<T extends ZodRawShape>(shape: T) {
  const camel = z.object(shape);

  // Transform keys to snake_case recursively
  const snakeShape: Record<string, ZodTypeAny> = {};
  for (const key of Object.keys(shape)) {
    const value = shape[key];
    if (value !== undefined) {
      snakeShape[toSnakeCase(key)] = transformSchemaToSnakeCase(value);
    }
  }

  const snake = z.object(snakeShape);

  return {
    camel,
    snake,
    transformInput: (input: unknown) =>
      camel.parse(
        camelcaseKeys(input as Record<string, unknown>, { deep: true }),
      ),
    transformOutput: <U>(data: U) => snakecaseKeys(data as any, { deep: true }),
  };
}
