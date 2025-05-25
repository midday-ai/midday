import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";
import { type ZodTypeAny, z } from "zod";

// Type helper to convert camelCase to snake_case
type ToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? "_" : ""}${Lowercase<T>}${ToSnakeCase<U>}`
  : S;

// Type helper to transform ZodObject to snake_case version
type TransformSchemaToSnakeCase<T extends ZodTypeAny> = T extends z.ZodObject<
  infer Shape
>
  ? z.ZodObject<{
      [K in keyof Shape as K extends string
        ? ToSnakeCase<K>
        : K]: Shape[K] extends ZodTypeAny
        ? TransformSchemaToSnakeCase<Shape[K]>
        : Shape[K];
    }>
  : T extends z.ZodArray<infer Element>
    ? z.ZodArray<TransformSchemaToSnakeCase<Element>>
    : T extends z.ZodOptional<infer Inner>
      ? z.ZodOptional<TransformSchemaToSnakeCase<Inner>>
      : T extends z.ZodNullable<infer Inner>
        ? z.ZodNullable<TransformSchemaToSnakeCase<Inner>>
        : T;

// Utility function to convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Utility function to actually transform a Zod schema to have snake_case field names
function transformZodSchemaToSnakeCase(schema: ZodTypeAny): ZodTypeAny {
  if (schema._def.typeName === "ZodObject") {
    const shape: Record<string, ZodTypeAny> = {};

    for (const [key, value] of Object.entries(schema._def.shape())) {
      const snakeKey = toSnakeCase(key);
      shape[snakeKey] = transformZodSchemaToSnakeCase(value as ZodTypeAny);
    }

    return z.object(shape);
  }

  if (schema._def.typeName === "ZodArray") {
    return z.array(transformZodSchemaToSnakeCase(schema._def.type));
  }

  if (schema._def.typeName === "ZodOptional") {
    return transformZodSchemaToSnakeCase(schema._def.innerType).optional();
  }

  if (schema._def.typeName === "ZodNullable") {
    return transformZodSchemaToSnakeCase(schema._def.innerType).nullable();
  }

  // For other types (string, number, enum, etc.), return as-is
  return schema;
}

export function createSchema<T extends ZodTypeAny>(schema: T) {
  return {
    camel: schema,
    snake: transformZodSchemaToSnakeCase(
      schema,
    ) as TransformSchemaToSnakeCase<T>, // Actual snake_case schema
    transformInput: (input: unknown) => {
      // Handle the case where input is undefined for optional schemas
      if (input === undefined) {
        return undefined;
      }
      // Convert snake_case input to camelCase and parse with the original schema
      return schema.parse(
        camelcaseKeys(input as Record<string, unknown>, { deep: true }),
      );
    },
    transformOutput: <U>(data: U) => snakecaseKeys(data as any, { deep: true }),
  };
}
