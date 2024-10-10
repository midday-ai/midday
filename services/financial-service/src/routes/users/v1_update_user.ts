import { users } from '@/db/schema';
import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { HonoEnv } from "@/hono/env";
import { createErrorResponse } from "@/utils/error";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { UpdateUserSchema, UserSchema } from "./schemas";

const updateUserRoute = createRoute({
  tags: ["users"],
  operationId: "updateUser",
  method: "put",
  path: "/users/{id}",
  summary: "Update User",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User updated successfully",
    },
    ...ErrorResponses
  },
});

export const registerV1UpdateUser = (app: OpenAPIHono<HonoEnv>) => {
  app.openapi(updateUserRoute, async (c) => {
    const { db } = c.get('ctx');
    const { id } = c.req.valid('param');
    const updateData = c.req.valid('json');

    try {
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return c.json({ error: "User not found" }, 404);
      }
      return c.json(updatedUser, 200);
    } catch (error) {
      const errorResponse = createErrorResponse(error, c.get("requestId"));
      return c.json(errorResponse, 500);
    }
  });
};

export type V1UpdateUserRoute = typeof updateUserRoute;
export type V1UpdateUserRequest = z.infer<typeof updateUserRoute.request.params> & z.infer<(typeof updateUserRoute.request.body.content)["application/json"]["schema"]>;
export type V1UpdateUserResponse = z.infer<(typeof updateUserRoute.responses)[200]["content"]["application/json"]["schema"]>;