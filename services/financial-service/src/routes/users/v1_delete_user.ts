import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { HonoEnv } from "@/hono/env";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const deleteUserRoute = createRoute({
    tags: ["users"],
    operationId: "deleteUser",
    method: "delete",
    path: "/users/{id}",
    summary: "Delete User",
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        204: {
            description: "User deleted successfully",
        },
        ...ErrorResponses
    },
});

export const registerV1DeleteUser = (app: OpenAPIHono<HonoEnv>) => {
    app.openapi(deleteUserRoute, async (c) => {
        const { id } = c.req.valid('param');
        const repo = c.get("repo");
        const userStore = repo.user

        const isDeleted = await userStore.delete(id);
        if (!isDeleted) {
            return c.json({ error: "User not found" }, 404);
        }

        return c.newResponse(null, 204);
    });
};

export type V1DeleteUserRoute = typeof deleteUserRoute;
export type V1DeleteUserRequest = z.infer<typeof deleteUserRoute.request.params>;