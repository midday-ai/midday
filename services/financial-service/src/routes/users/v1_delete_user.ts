import {
  openApiErrorResponses as ErrorResponses,
  ServiceApiError,
} from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { DeleteUserApiResponse } from "./schemas";

const deleteUserRoute = createRoute({
  tags: [...Routes.Users.delete.tags],
  operationId: Routes.Users.delete.operationId,
  method: Routes.Users.delete.method,
  path: Routes.Users.delete.path,
  summary: Routes.Users.delete.summary,
  request: {
    params: z.object({
      id: z.string(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DeleteUserApiResponse,
        },
      },
      description: "User deleted successfully",
    },
    ...ErrorResponses,
  },
});

export const registerV1DeleteUser = (app: App) => {
  app.openapi(deleteUserRoute, async (c) => {
    const { id } = c.req.valid("param");
    const repo = c.get("repo");
    const userStore = repo.user;

    // convert id to number
    const userId = parseInt(id, 10);

    const isDeleted = await userStore.delete(userId);
    console.log("isDeleted", isDeleted);
    if (!isDeleted) {
      throw new ServiceApiError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return c.json({ success: true }, 200);
  });
};

export type V1DeleteUserRoute = typeof deleteUserRoute;
export type V1DeleteUserRequest = z.infer<
  typeof deleteUserRoute.request.params
>;
export type V1DeleteUserResponse = z.infer<
  (typeof deleteUserRoute.responses)[204]["content"]["application/json"]["schema"]
>;
