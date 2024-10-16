import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { DeleteUserApiResponse } from "./schemas";

const deleteUserRoute = createRoute({
    tags: ["users"],
    operationId: "deleteUserApi",
    method: "delete",
    path: "/v1/api.users/{id}",
    summary: "Delete User",
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        204: {
            content: {
                "application/json": {
                    schema: DeleteUserApiResponse,
                },
            },
            description: "User deleted successfully",
        },
        ...ErrorResponses
    },
});

export const registerV1DeleteUser = (app: App) => {
    app.openapi(deleteUserRoute, async (c) => {
        const { id } = c.req.valid('param');
        const repo = c.get("repo");
        const userStore = repo.user

        const isDeleted = await userStore.delete(id);
        if (!isDeleted) {
            throw new ServiceApiError({
                code: "NOT_FOUND",
                message: "User not found"
            });
        }

        return c.json({ success: true }, 204);
    });
};

export type V1DeleteUserRoute = typeof deleteUserRoute;
export type V1DeleteUserRequest = z.infer<typeof deleteUserRoute.request.params>;