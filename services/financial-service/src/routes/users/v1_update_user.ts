import {
    openApiErrorResponses as ErrorResponses,
    ServiceApiError,
} from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { UpdateUserSchema, UpdateUserSchemaResponse } from "./schemas";

const updateUserRoute = createRoute({
  tags: [...Routes.Users.update.tags],
  operationId: Routes.Users.update.operationId,
  method: Routes.Users.update.method,
  path: Routes.Users.update.path,
  summary: Routes.Users.update.summary,
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
          schema: UpdateUserSchemaResponse,
        },
      },
      description: "User updated successfully",
    },
    ...ErrorResponses,
  },
});
export const registerV1UpdateUser = (app: App) => {
  app.openapi(updateUserRoute, async (c) => {
    const { id } = c.req.valid("param");
    const repo = c.get("repo");
    const { user: userDb } = repo;
    const updateData = c.req.valid("json");
    // convert id to number
    const userId = parseInt(id, 10);

    const updatedUser = await userDb.update(userId, updateData);
    if (!updatedUser) {
      throw new ServiceApiError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return c.json(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
      200,
    );
  });
};

export type V1UpdateUserRoute = typeof updateUserRoute;
export type V1UpdateUserRequest = z.infer<
  typeof updateUserRoute.request.params
> &
  z.infer<
    (typeof updateUserRoute.request.body.content)["application/json"]["schema"]
  >;
export type V1UpdateUserResponse = z.infer<
  (typeof updateUserRoute.responses)[200]["content"]["application/json"]["schema"]
>;
