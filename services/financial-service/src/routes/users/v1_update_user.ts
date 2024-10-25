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
    const updateData = c.req.valid("json");
    const repo = c.get("repo");
    const { user: userDb } = repo;

    // Convert and validate ID
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "Invalid user ID format",
      });
    }

    // Validate email format if provided
    if (updateData.email && !isValidEmail(updateData.email)) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "Invalid email format",
      });
    }

    if (updateData.name?.length === 0) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "Name must not be empty",
      });
    }

    // Validate name if provided
    if (updateData.name && !isValidName(updateData.name)) {
      throw new ServiceApiError({
        code: "BAD_REQUEST",
        message: "Invalid name format: must not be empty and contain valid characters",
      });
    }

    try {
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
    } catch (error) {
      if (error instanceof ServiceApiError) {
        throw error;
      }

      // Handle database errors or other unexpected issues
      throw new ServiceApiError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating the user",
      });
    }
  });
};

// Helper functions for validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidName(name: string): boolean {
  return name.trim().length > 0 && name.length <= 100;
}
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
export type V1UpdateUserResponse401 = z.infer<
  (typeof updateUserRoute.responses)[401]["content"]["application/json"]["schema"]
>;
export type V1UpdateUserResponse404 = z.infer<
  (typeof updateUserRoute.responses)[404]["content"]["application/json"]["schema"]
>;
export type V1UpdateUserResponse400 = z.infer<
  (typeof updateUserRoute.responses)[400]["content"]["application/json"]["schema"]
>;
