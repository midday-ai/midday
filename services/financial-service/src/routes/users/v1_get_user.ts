import { UserRepository } from "@/data/userRepository";
import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { HonoEnv } from "@/hono/env";
import { createErrorResponse } from "@/utils/error";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { UserSchema } from "./schemas";

const getUserRoute = createRoute({
    tags: ["users"],
    operationId: "getUser",
    method: "get",
    path: "/users/{id}",
    summary: "Get User",
    request: {
        params: z.object({
            id: z.string(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: UserSchema,
                },
            },
            description: "User retrieved successfully",
        },
        ...ErrorResponses
    },
});
export const registerV1GetUser = (app: OpenAPIHono<HonoEnv>) => {
    app.openapi(getUserRoute, async (c) => {
        const { id } = c.req.valid('param');
        const repo = c.get("repo");
        const userStore = repo.user;

        const user = await userStore.getById(id);
        if (!user) {
            throw new ServiceApiError({
                code: "NOT_FOUND",
                message: "User not found"
            });
        }

        
        return c.json({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt?.toISOString() ?? null,
            updatedAt: user.updatedAt?.toISOString() ?? null
        }, 200);
    });
};

export type V1GetUserRoute = typeof getUserRoute;
export type V1GetUserRequest = z.infer<typeof getUserRoute.request.params>;
export type V1GetUserResponse = z.infer<(typeof getUserRoute.responses)[200]["content"]["application/json"]["schema"]>;