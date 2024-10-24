import { z } from "@hono/zod-openapi";

/**
 * Represents the complete user schema.
 * @property {string} id - The unique identifier for the user.
 * @property {string} email - The user's email address.
 * @property {string | null} name - The user's name (optional).
 * @property {Date} createdAt - The timestamp when the user was created.
 * @property {Date} updatedAt - The timestamp when the user was last updated.
 */
export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for creating a new user.
 * Omits the 'id', 'createdAt', and 'updatedAt' fields from the UserSchema.
 */
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Represents the API response for creating a user.
 */
export const CreateUserSchemaResponse = UserSchema.openapi(
  "CreateUserSchemaResponse",
);

/**
 * Schema for updating an existing user.
 * Makes all fields from the CreateUserSchema optional.
 */
export const UpdateUserSchema = CreateUserSchema.partial();

/**
 * Represents the API response for updating a user.
 * @property {string} id - The unique identifier for the user.
 * @property {string} email - The user's email address.
 * @property {string | null} name - The user's name (optional).
 * @property {Date} createdAt - The timestamp when the user was created.
 * @property {Date} updatedAt - The timestamp when the user was last updated.
 */
export const UpdateUserSchemaResponse = UserSchema.partial().openapi(
  "UpdateUserSchemaResponse",
);

/**
 * Represents the API response for deleting a user.
 * @property {boolean} success - Indicates whether the deletion was successful.
 */
export const DeleteUserApiResponse = z
  .object({
    success: z.boolean().openapi({
      example: true,
    }),
  })
  .openapi("DeleteUserApiResponse");

/**
 * Represents the API response for retrieving a user.
 * @property {string} id - The unique identifier for the user.
 * @property {string} email - The user's email address.
 * @property {string | null} name - The user's name (optional).
 * @property {Date | null} createdAt - The timestamp when the user was created (optional).
 * @property {Date | null} updatedAt - The timestamp when the user was last updated (optional).
 */
export const GetUserResponse = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().nullable(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
  })
  .openapi("GetUserResponse");
