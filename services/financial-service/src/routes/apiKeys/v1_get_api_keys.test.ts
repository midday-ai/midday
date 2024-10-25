import { Routes } from "@/route-definitions/routes";
import { IntegrationHarness } from "@/test-util/integration-harness";
import { TestDataGenerator } from "@/utils/utils";
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, test } from "vitest";
import {
    type V1CreateUserRequest,
    type V1CreateUserResponse,
} from "../users/v1_create_user";
import { V1CreateApiKeyRequest, V1CreateApiKeyResponse } from "./v1_create_api_key";
import { V1GetApiKeysResponse } from "./v1_get_api_keys";

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        docs?: string;
        requestId?: string;
    };
}

describe("V1 Get API Keys Route", () => {
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

        // Create a test user
        const createUserData = generator.generateUserData();
        const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
            url: Routes.Users.create.path,
            body: createUserData,
            headers: {
                "Content-Type": "application/json",
            },
        });

        createdUserId = response.body.id.toString();

        // Create an initial API key
        const apiKeyResponse = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
            url: Routes.ApiKeys.create.path,
            body: {
                userId: response.body.id,
                name: "Test API Key",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            },
            headers: createAuthHeaders(),
        });

        validApiKey = apiKeyResponse.body.key;
        validUserId = createdUserId;
    });

    // describe("GET /v1/api-keys - Authentication", () => {
    //     test("should reject request without API key", async () => {
    //         const response = await harness.get<ErrorResponse>({
    //             url: `${Routes.ApiKeys.base.path}?userId=${createdUserId}`,
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });

    //     test("should reject request with invalid API key", async () => {
    //         const response = await harness.get<ErrorResponse>({
    //             url: `${Routes.ApiKeys.base.path}?userId=${createdUserId}`,
    //             headers: createAuthHeaders("invalid-api-key"),
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });
    // });

    describe("GET /v1/api-keys - Query Parameters", () => {
        test("should return 400 when userId is missing", async () => {
            const response = await harness.get<ErrorResponse>({
                url: Routes.ApiKeys.base.path,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should return 400 for invalid userId format", async () => {
            const response = await harness.get<ErrorResponse>({
                url: Routes.ApiKeys.base.path.replace("{userId}", "invalid-id"),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });
    });

    describe("GET /v1/api-keys - Success Cases", () => {
        test("should return empty array for user with no API keys", async () => {
            // Create a new user without API keys
            const newUserResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                body: generator.generateUserData(),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const response = await harness.get<V1GetApiKeysResponse>({
                url: `${Routes.ApiKeys.base.path}?userId=${newUserResponse.body.id}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data).toHaveLength(0);
        });

        test("should return all API keys for user", async () => {
            // Create additional API keys
            const additionalKeys = 3;
            for (let i = 0; i < additionalKeys; i++) {
                await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                    url: Routes.ApiKeys.create.path,
                    body: {
                        userId: parseInt(createdUserId),
                        name: `Additional Key ${i}`,
                        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                    },
                    headers: createAuthHeaders(),
                });
            }

            const response = await harness.get<V1GetApiKeysResponse>({
                url: `${Routes.ApiKeys.base.path}?userId=${createdUserId}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data).toHaveLength(additionalKeys + 1); // Including the initial key

            // Verify API key properties
            response.body.data.forEach(apiKey => {
                expect(apiKey).toHaveProperty('id');
                expect(apiKey).toHaveProperty('key');
                expect(apiKey).toHaveProperty('name');
                expect(apiKey).toHaveProperty('userId');
                expect(apiKey).toHaveProperty('expiresAt');
                expect(apiKey).toHaveProperty('createdAt');
                expect(apiKey).toHaveProperty('updatedAt');
                expect(apiKey.userId).toBe(parseInt(createdUserId));
            });
        });

        test("should handle cross-user API key retrieval", async () => {
            // Create another user with their own API keys
            const secondUserResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                body: generator.generateUserData(),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // Create API key for second user
            await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                url: Routes.ApiKeys.create.path,
                body: {
                    userId: secondUserResponse.body.id,
                    name: "Second User Key",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                },
                headers: createAuthHeaders(),
            });

            // Try to get second user's API keys using first user's credentials
            const response = await harness.get<V1GetApiKeysResponse>({
                url: `${Routes.ApiKeys.base.path}?userId=${secondUserResponse.body.id}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data.length).toBe(1);
        });
    });

    describe("GET /v1/api-keys - Performance", () => {
        test("should handle large number of API keys efficiently", async () => {
            // Create 20 API keys
            const numberOfKeys = 20;
            const createPromises = Array(numberOfKeys).fill(null).map((_, i) =>
                harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                    url: Routes.ApiKeys.create.path,
                    body: {
                        userId: parseInt(createdUserId),
                        name: `Performance Test Key ${i}`,
                        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                    },
                    headers: createAuthHeaders(),
                })
            );

            await Promise.all(createPromises);

            const startTime = Date.now();
            const response = await harness.get<V1GetApiKeysResponse>({
                url: `${Routes.ApiKeys.base.path}?userId=${createdUserId}`,
                headers: createAuthHeaders(),
            });
            const duration = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(numberOfKeys + 1); // Including initial key
            expect(duration).toBeLessThan(1000); // Should respond within 1 second
        });
    });
});