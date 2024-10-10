import { z } from "@hono/zod-openapi";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateUserSchema = CreateUserSchema.partial();