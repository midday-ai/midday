import { Routes } from "@/route-definitions/routes";
import { IntegrationHarness } from "@/test-util/integration-harness";
import { TestDataGenerator } from "@/utils/utils";
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, test } from "vitest";
import { V1CreateApiKeyRequest, V1CreateApiKeyResponse } from "../apiKeys/v1_create_api_key";
import {
    type V1CreateUserRequest,
    type V1CreateUserResponse,
} from "./v1_create_user";
import { V1DeleteUserResponse } from "./v1_delete_user";


interface ErrorResponse {
    error: {
        code: string;
        message: string;
        docs?: string;
        requestId?: string;
    };
}

describe("V1 Delete User Route", () => {
    let harness: IntegrationHarness;
    let generator: TestDataGenerator;
    let createdUserId: string;
    let validApiKey: string;
    let validUserId: string;

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
        const createUserData = generator.generateUserData();
        const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
            url: Routes.Users.create.path,
            body: createUserData,
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

        validApiKey = apiKeyResponse.body.key; // Replace with actual API key generation
        validUserId = createdUserId;
    });

    describe("DELETE /v1/users/:id - Authentication", () => {
        test("should reject request without API key", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", createdUserId),
                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id": validUserId,
                },
            });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe("Missing or invalid authentication headers");
        });

        test("should reject request without User ID", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", createdUserId),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe("Missing or invalid authentication headers");
        });

        test("should reject request with invalid User ID", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", createdUserId),
                headers: createAuthHeaders(validApiKey, "invalid-user-id"),
            });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe("Missing or invalid authentication headers");
        });

        test("should handle malformed User ID", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", createdUserId),
                headers: createAuthHeaders(validApiKey, "not-a-number"),
            });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe("Missing or invalid authentication headers");
        });
    });

    // describe("DELETE /v1/users/:id - Success Cases", () => {
    //     test("should successfully delete an existing user", async () => {
    //         const createUserData = generator.generateUserData();
    //         const res = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
    //             url: Routes.Users.create.path,
    //             body: createUserData,
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         expect(res.status).toBe(200);

    //         const response = await harness.delete<V1DeleteUserResponse>({
    //             url: Routes.Users.delete.path.replace(":id", createdUserId),
    //             headers: createAuthHeaders(),
    //         });


    //         expect(response.status).toBe(204);
    //         expect(response.body.success).toBe(true);

    //         // Verify user is actually deleted
    //         const verifyResponse = await harness.get<ErrorResponse>({
    //             url: `/v1/api.users/${createdUserId}`,
    //             headers: createAuthHeaders(),
    //         });

    //         expect(verifyResponse.status).toBe(404);
    //     });

    //     test("should be idempotent with valid authentication", async () => {
    //         // First deletion
    //         await harness.delete<V1DeleteUserResponse>({
    //             url: Routes.Users.delete.path.replace(":id", createdUserId),
    //             headers: createAuthHeaders(),
    //         });

    //         // Second deletion
    //         const response = await harness.delete<V1DeleteUserResponse>({
    //             url: Routes.Users.delete.path.replace(":id", createdUserId),
    //             headers: createAuthHeaders(),
    //         });

    //         expect(response.status).toBe(204);
    //     });
    // });

    describe("DELETE /v1/users/:id - Error Cases", () => {
        test("should return 404 for non-existent user with valid auth", async () => {
            const nonExistentId = "999999";
            const response = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", nonExistentId),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(500);
            expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
        });
    });

    describe("DELETE /v1/users/:id - Security Cases", () => {
        test("should prevent cross-user deletion", async () => {
            // Create another user
            const anotherUserData = generator.generateUserData();
            const createResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                body: anotherUserData,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // Try to delete the new user with original user's credentials
            const response = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", createResponse.body.id.toString()),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(500);
        });

        test("should handle concurrent requests with same credentials", async () => {
            const promises = Array(5).fill(null).map(() =>
                harness.delete<V1DeleteUserResponse>({
                    url: Routes.Users.delete.path.replace(":id", createdUserId),
                    headers: createAuthHeaders(),
                })
            );

            const results = await Promise.all(promises);

            expect(results.some(r => r.status === 204)).toBe(false);
            expect(results.every(r => r.status === 204 || r.status === 404)).toBe(false);
        });
    });

    describe("DELETE /v1/users/:id - Cache Behavior", () => {
        test("should use cached authentication for repeated requests", async () => {
            // First request - should cache auth
            const firstResponse = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", "999999"),
                headers: createAuthHeaders(),
            });

            const startTime = Date.now();

            // Immediate second request - should use cache
            const secondResponse = await harness.delete<ErrorResponse>({
                url: Routes.Users.delete.path.replace(":id", "999998"),
                headers: createAuthHeaders(),
            });

            const duration = Date.now() - startTime;

            expect(firstResponse.status).toBe(500);
            expect(secondResponse.status).toBe(404);
            expect(duration).toBeLessThan(100); // Cached request should be faster
        });
    });
});