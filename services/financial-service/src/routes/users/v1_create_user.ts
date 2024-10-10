import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { HonoEnv } from "@/hono/env";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateUserSchema, UserSchema } from "./schemas";

const createUserRoute = createRoute({
    tags: ["users"],
    operationId: "createUser",
    method: "post",
    path: "/users",
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
                    schema: UserSchema,
                },
            },
            description: "User created successfully",
        },
        ...ErrorResponses
    },
});

export const registerV1CreateUser = (app: OpenAPIHono<HonoEnv>) => {
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