import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createRoute, z } from "@hono/zod-openapi";
import { CreateUserSchema, CreateUserSchemaResponse } from "./schemas";
    
const createUserRoute = createRoute({
    tags: [...Routes.Users.create.tags],
    operationId: Routes.Users.create.operationId,
    method: Routes.Users.create.method,
    path: Routes.Users.create.path,
    summary: Routes.Users.create.summary,
    request: {
        body: {
            content: {
                "application/json": {
                    schema: CreateUserSchema,
                },
            },
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: CreateUserSchemaResponse,
                },
            },
            description: "User created successfully",
        },
        ...ErrorResponses
    },
});
export const registerV1CreateUser = (app: App) => {
    app.openapi(createUserRoute, async (c) => {
        const userData = c.req.valid("json");

        const repo = c.get("repo");
        const userStore = repo.user;
        const user = await userStore.create({
            email: userData.email,
            name: userData.name,
            passwordHash: crypto.randomUUID(),
        });
        
        return c.json({
            status: user.status,
            name: user.name,
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            role: user.role,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }, 200);
    });
};


export type V1CreateUserRoute = typeof createUserRoute;
export type V1CreateUserRequest = z.infer<(typeof createUserRoute.request.body.content)["application/json"]["schema"]>;
export type V1CreateUserResponse = z.infer<(typeof createUserRoute.responses)[200]["content"]["application/json"]["schema"]>;