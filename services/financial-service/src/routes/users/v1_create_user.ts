import {
    BadRequestError,
    ConflictError,
    openApiErrorResponses as ErrorResponses
} from "@/errors";
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
        ...ErrorResponses,
    },
});
export const registerV1CreateUser = (app: App) => {
    app.openapi(createUserRoute, async (c) => {
        const userData = c.req.valid("json");

        const repo = c.get("repo");
        const userStore = repo.user;

        // Check if email is null or undefined
        if (userData.email == null) {
            throw new BadRequestError({
                code: 'BAD_REQUEST',
                message: 'Email is required'
            });
        }

        // Convert email to lowercase, remove whitespace, and check length
        userData.email = userData.email.trim().toLowerCase();
        if (userData.email.length > 256) {
            throw new BadRequestError({
                code: 'BAD_REQUEST',
                message: 'Email address must not exceed 256 characters'
            });
        }

        // Check if name is null or undefined before trimming
        if (userData.name != null) {
            userData.name = userData.name.trim();
        }

        // Check if a user with the same email already exists
        const existingUser = await userStore.findByEmail(userData.email);
        if (existingUser) {
            throw new ConflictError({
                code: 'CONFLICT',
                message: 'A user with this email already exists'
            });
        }

        const user = await userStore.create({
            email: userData.email,
            name: userData.name,
            passwordHash: crypto.randomUUID(),
        });

        return c.json(
            {
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
            },
            200,
        );
    });
};

export type V1CreateUserRoute = typeof createUserRoute;
export type V1CreateUserRequest = z.infer<
    (typeof createUserRoute.request.body.content)["application/json"]["schema"]
>;
export type V1CreateUserResponse = z.infer<
    (typeof createUserRoute.responses)[200]["content"]["application/json"]["schema"]
>;

export type V1CreateUserResponse400 = z.infer<
    (typeof createUserRoute.responses)[400]["content"]["application/json"]["schema"]
>;

export type V1CreateUserResponse409 = z.infer<
    (typeof createUserRoute.responses)[409]["content"]["application/json"]["schema"]
>;
