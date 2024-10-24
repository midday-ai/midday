import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { GetUserResponse } from "./schemas";

/**
 * OpenAPI route configuration for getting a user by ID.
 * @remarks
 * This route is used to retrieve a single user's information based on their unique identifier.
 */
const getUserRoute = createRoute({
    tags: [...Routes.Users.get.tags],
    operationId: Routes.Users.get.operationId,
    method: Routes.Users.get.method,
    path: Routes.Users.get.path,
    summary: Routes.Users.get.summary,
    request: {
        params: z.object({
            id: z.number(),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: GetUserResponse,
                },
            },
            description: "User retrieved successfully",
        },
        ...ErrorResponses
    },
});

/**
 * Registers the GET user route with the application.
 * @param app - The Hono application instance.
 * @remarks
 * This function sets up the route handler for retrieving a user by ID.
 * It performs the following steps:
 * 1. Extracts the user ID from the request parameters.
 * 2. Retrieves the user repository from the context.
 * 3. Attempts to fetch the user by ID.
 * 4. If the user is not found, it throws a NOT_FOUND error.
 * 5. If the user is found, it returns the user data in JSON format.
 * @throws {ServiceApiError} When the user is not found.
 */
export const registerV1GetUser = (app: App) => {
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

/** Type representing the GET user route configuration. */
export type V1GetUserRoute = typeof getUserRoute;

/** Type representing the request parameters for the GET user route. */
export type V1GetUserRequest = z.infer<typeof getUserRoute.request.params>;

/** Type representing the response body for a successful GET user request. */
export type V1GetUserResponse = z.infer<(typeof getUserRoute.responses)[200]["content"]["application/json"]["schema"]>;