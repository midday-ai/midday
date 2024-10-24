import { UserRepository } from "@/db-repository/user-repository";
import { Routes } from "@/route-definitions/routes";
import { CreateUserSchema } from "@/routes/users/schemas";
import { V1CreateUserRequest, V1CreateUserResponse } from "@/routes/users/v1_create_user";
import { env } from "cloudflare:test";
import { testClient } from 'hono/testing';
import { IntegrationHarness } from "test/test-util/integration-harness";
import { beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";
import { newApp } from '../../hono/app';

describe("User Creation API", () => {
    let harness: IntegrationHarness;
    let userRepo: UserRepository;
    const apiClient: any = testClient(newApp(), env)

    beforeEach(async (t) => {
        harness = await IntegrationHarness.init(t, env.DB);
        userRepo = new UserRepository(harness.db);
    });

    describe("successful creation", () => {
        test("creates a new user with valid data", async () => {
            const requestBody: z.infer<typeof CreateUserSchema> = {
                email: "test@gmail.com",
                name: "Test User",
            };

            const ress = await apiClient.api.users.$post({
                // url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody
            });

            // const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
            //     url: Routes.Users.create.path,
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            //     body: requestBody
            // });

            console.log("response from test", ress)

            expect(ress.status).toBe(200);
            expect(ress.body).toBeDefined();

            // Verify response structure
            expect(ress.body).toMatchObject({
                email: requestBody.email,
                name: requestBody.name,
                id: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });

            // Verify database record
            const found = await userRepo.getByEmail(requestBody.email);
            expect(found).toBeDefined();
            expect(found!.email).toBe(requestBody.email);
            expect(found!.name).toBe(requestBody.name);
        });

        test("creates a user with null name", async () => {
            const requestBody: z.infer<typeof CreateUserSchema> = {
                email: "nullname@gmail.com",
                name: null,
            };

            const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody
            });

            expect(res.status).toBe(200);
            const found = await userRepo.getByEmail(requestBody.email);
            expect(found!.name).toBeNull();
        });
    });

    describe("validation errors", () => {
        test("rejects invalid email format", async () => {
            const requestBody = {
                email: "invalid-email",
                name: "Test User",
            };

            const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody
            });

            expect(res.status).toBe(400);
            const found = await userRepo.getByEmail(requestBody.email);
            expect(found).toBeNull();
        });

        test("rejects missing required fields", async () => {
            const requestBody = {
                name: "Test User",
            };

            const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody as any
            });

            expect(res.status).toBe(400);
        });
    });

    describe("duplicate handling", () => {
        test("handles duplicate email appropriately", async () => {
            const requestBody: z.infer<typeof CreateUserSchema> = {
                email: "duplicate@gmail.com",
                name: "First User",
            };

            // Create first user
            await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody
            });

            // Attempt to create second user with same email
            const duplicateRes = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: {
                    ...requestBody,
                    name: "Second User"
                }
            });

            expect(duplicateRes.status).toBe(409);
        });
    });

    describe("response format", () => {
        test("returns correctly formatted timestamps", async () => {
            const requestBody: z.infer<typeof CreateUserSchema> = {
                email: "timestamps@gmail.com",
                name: "Time Test",
            };

            const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                headers: {
                    "Content-Type": "application/json",
                },
                body: requestBody
            });

            expect(res.status).toBe(200);
            expect(res.body).toBeDefined();
            // Verify ISO 8601 timestamp format
            expect(typeof res.body.createdAt).toBe('string');
            expect(typeof res.body.updatedAt).toBe('string');
            expect(res.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

            test("includes all required response fields", async () => {
                const requestBody: z.infer<typeof CreateUserSchema> = {
                    email: "fields@gmail.com",
                    name: "Field Test",
                };

                const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                    url: Routes.Users.create.path,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: requestBody
                });

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('id');
                expect(res.body).toHaveProperty('email');
                expect(res.body).toHaveProperty('name');
                expect(res.body).toHaveProperty('createdAt');
                expect(res.body).toHaveProperty('updatedAt');
                expect(res.body).toHaveProperty('status');
                expect(res.body).toHaveProperty('role');
                expect(res.body).toHaveProperty('avatarUrl');
                expect(res.body).toHaveProperty('bio');
                expect(res.body).toHaveProperty('bio');
            });
        });
    })
});
