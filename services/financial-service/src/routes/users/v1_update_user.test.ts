import { Routes } from "@/route-definitions/routes";
import { IntegrationHarness } from "@/test-util/integration-harness";
import { TestDataGenerator } from "@/utils/utils";
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, test } from "vitest";
import { i } from "vitest/dist/reporters-LqC_WI4d.js";
import { V1CreateApiKeyRequest, V1CreateApiKeyResponse } from "../apiKeys/v1_create_api_key";
import {
    type V1CreateUserRequest,
    type V1CreateUserResponse,
} from "./v1_create_user";
import { V1UpdateUserRequest, V1UpdateUserResponse, V1UpdateUserResponse400, V1UpdateUserResponse401, V1UpdateUserResponse404 } from "./v1_update_user";

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        docs?: string;
        requestId?: string;
    };
}

describe("V1 Update User Route", () => {
    let harness: IntegrationHarness;
    let generator: TestDataGenerator;
    let createdUserId: string;
    let validApiKey: string;
    let validUserId: string;
    let originalUserData: V1CreateUserRequest;

    // Helper function to create auth headers
    const createAuthHeaders = (apiKey?: string, userId?: string) => ({
        "Content-Type": "application/json",
        "X-API-Key": apiKey || validApiKey,
        "X-User-Id": userId || validUserId,
    });

    beforeEach(async (task) => {
        harness = await IntegrationHarness.init(task, env.DB);
        generator = new TestDataGenerator(`test-${Date.now()}`);

        // Create a test user and get their API key
        originalUserData = generator.generateUserData();
        const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
            url: Routes.Users.create.path,
            body: originalUserData,
            headers: {
                "Content-Type": "application/json",
            },
        });

        createdUserId = response.body.id.toString();

        // create an API key
        const apiKeyResponse = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
            url: Routes.ApiKeys.create.path,
            body: {
                userId: response.body.id,
                name: response.body.name,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            },
            headers: createAuthHeaders(),
        });

        validApiKey = apiKeyResponse.body.key;
        validUserId = createdUserId;
    });

    // describe("PUT /v1/users/:id - Authentication", () => {
    //     test("should reject request without API key", async () => {
    //         const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse401>({
    //             url: Routes.Users.update.path.replace("{id}", createdUserId),
    //             body: { id: createdUserId, name: "Updated Name" },
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });

    //     test("should reject request without User ID", async () => {
    //         const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse401>({
    //             url: Routes.Users.update.path.replace("{id}", createdUserId),
    //             body: { id: createdUserId, name: "Updated Name" },
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });

    //     test("should reject request with invalid API key", async () => {
    //         const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse401>({
    //             url: Routes.Users.update.path.replace("{id}", createdUserId),
    //             body: { id: createdUserId, name: "Updated Name" },
    //             headers: createAuthHeaders("invalid-api-key", validUserId),
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });
    // });

    describe("PUT /v1/users/:id - Error Cases", () => {
        test("should return 404 for non-existent user", async () => {
            const nonExistentId = "999999";
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse404>({
                url: Routes.Users.update.path.replace("{id}", nonExistentId),
                body: { id: nonExistentId, name: "Updated Name" },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("NOT_FOUND");
            expect(response.body.error.message).toBe("User not found");
        });

        test("should handle invalid user ID format", async () => {
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse400>({
                url: Routes.Users.update.path.replace("{id}", "invalid-id"),
                body: { id: "invalid-id", name: "Updated Name" },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should reject invalid email format", async () => {
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse400>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: { id: createdUserId, email: "invalid-email" },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should reject empty name", async () => {
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse400>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: { id: createdUserId, name: "" },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });
    });

    describe("PUT /v1/users/:id - Success Cases", () => {
        test("should successfully update user name", async () => {
            const newName = "Updated Name";
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: { id: createdUserId, name: newName },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(parseInt(createdUserId));
            expect(response.body.name).toBe(newName);
            expect(response.body.email).toBe(originalUserData.email);
            expect(response.body.updatedAt).toBeDefined();
        });

        test("should successfully update user email", async () => {
            const newEmail = "updated@example.com";
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: { id: createdUserId, email: newEmail },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(parseInt(createdUserId));
            expect(response.body.name).toBe(originalUserData.name);
            expect(response.body.email).toBe(newEmail);
            expect(response.body.updatedAt).toBeDefined();
        });

        test("should successfully update multiple fields", async () => {
            const updates = {
                name: "New Name",
                email: "newemail@example.com",
                id: createdUserId,
            };

            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: updates,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(parseInt(createdUserId));
            expect(response.body.name).toBe(updates.name);
            expect(response.body.email).toBe(updates.email);
            expect(response.body.updatedAt).toBeDefined();

        });

        test("should maintain unchanged fields", async () => {
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: { id: createdUserId, name: "New Name" },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.email).toBe(originalUserData.email);
        });
    });

    describe("PUT /v1/users/:id - Concurrency Handling", () => {
        test("should handle concurrent updates correctly", async () => {
            const updates = Array(5).fill(null).map((_, i) => ({
                name: `Concurrent Update ${i}`,
                email: `concurrent${i}@example.com`,
                id: createdUserId,
            }));

            const responses = await Promise.all(
                updates.map(update =>
                    harness.put<V1UpdateUserRequest, V1UpdateUserResponse>({
                        url: Routes.Users.update.path.replace("{id}", createdUserId),
                        body: update,
                        headers: createAuthHeaders(),
                    })
                )
            );

            // All requests should succeed
            expect(responses.every(r => r.status === 200)).toBe(true);

            // Final state should match one of the updates
            const finalResponse = await harness.get<V1UpdateUserResponse>({
                url: Routes.Users.get.path.replace("{id}", createdUserId),
                headers: createAuthHeaders(),
            });

            expect(updates.some(update =>
                update.name === finalResponse.body.name &&
                update.email === finalResponse.body.email
            )).toBe(true);
        });
    });

    describe("PUT /v1/users/:id - Validation", () => {
        test("should reject update with empty body", async () => {
            const response = await harness.put<V1UpdateUserRequest, V1UpdateUserResponse400>({
                url: Routes.Users.update.path.replace("{id}", createdUserId),
                body: { id: createdUserId },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });
    });
});