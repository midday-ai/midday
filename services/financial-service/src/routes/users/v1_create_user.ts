import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { createRoute, z } from "@hono/zod-openapi";
import { CreateUserSchema, CreateUserSchemaResponse } from "./schemas";

const createUserRoute = createRoute({
    tags: ["users"],
    operationId: "createUserApi",
    method: "post",
    path: "/user",
    summary: "Create User",
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
        const userStore = repo.user

        const user = await userStore.create({
            ...userData,
            id: '',
            passwordHash: ''
        });
        return c.json(user, 200);
    });
};

export type V1CreateUserRoute = typeof createUserRoute;
export type V1CreateUserRequest = z.infer<(typeof createUserRoute.request.body.content)["application/json"]["schema"]>;
export type V1CreateUserResponse = z.infer<(typeof createUserRoute.responses)[200]["content"]["application/json"]["schema"]>;