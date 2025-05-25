import type { z } from "zod";
import { createSchema } from "zod-openapi";

/**
 * Convert a Zod schema to an OpenAPI schema object for use in requestBody
 * Uses zod-openapi's createSchema function to properly extract OpenAPI metadata
 */
export function requestBodyResolver<T extends z.ZodTypeAny>(
  schema: T,
): {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
} {
  try {
    // Use zod-openapi's createSchema function to properly extract OpenAPI metadata
    const { schema: openApiSchema } = createSchema(schema);
    return openApiSchema as {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  } catch (error) {
    console.warn(
      "Failed to use zod-openapi createSchema, falling back to manual extraction:",
      error,
    );
    // Fallback to manual extraction if createSchema fails
    return manualSchemaExtraction(schema);
  }
}

/**
 * Fallback manual schema extraction (original implementation)
 */
function manualSchemaExtraction<T extends z.ZodTypeAny>(
  schema: T,
): {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
} {
  let shape: Record<string, any> = {};

  // Check if it's a ZodObject with shape() method
  if ((schema as any)._def?.typeName === "ZodObject") {
    const shapeFn = (schema as any)._def?.shape;
    if (typeof shapeFn === "function") {
      shape = shapeFn();
    } else if (shapeFn && typeof shapeFn === "object") {
      shape = shapeFn;
    }
  }

  if (Object.keys(shape).length === 0) {
    console.log(
      "Could not find shape in schema, schema type:",
      (schema as any)._def?.typeName,
    );
    return {
      type: "object",
      properties: {},
    };
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const [key, fieldSchema] of Object.entries(shape)) {
    const field = fieldSchema as z.ZodTypeAny;

    // Simple property extraction for fallback
    properties[key] = getSimpleProperty(field);

    // Check if field is required
    if (!isOptional(field)) {
      required.push(key);
    }
  }

  const result: any = {
    type: "object",
    properties,
  };

  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

/**
 * Simple property extraction for fallback (no metadata)
 */
function getSimpleProperty(field: z.ZodTypeAny): any {
  const fieldDef = (field as any)._def;

  // Handle optional types
  if (fieldDef.typeName === "ZodOptional") {
    return getSimpleProperty(fieldDef.innerType);
  }

  // Handle basic types
  if (fieldDef.typeName === "ZodString") {
    return { type: "string" };
  }
  if (fieldDef.typeName === "ZodBoolean") {
    return { type: "boolean" };
  }
  if (fieldDef.typeName === "ZodNumber") {
    return { type: "number" };
  }
  if (fieldDef.typeName === "ZodEnum") {
    return { type: "string", enum: fieldDef.values };
  }

  // Default fallback
  return { type: "string" };
}

/**
 * Check if a Zod field is optional
 */
function isOptional(field: z.ZodTypeAny): boolean {
  const fieldDef = (field as any)._def;
  return fieldDef.typeName === "ZodOptional";
}
