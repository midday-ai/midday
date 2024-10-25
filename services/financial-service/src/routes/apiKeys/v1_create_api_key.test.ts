import { Routes } from "@/route-definitions/routes";
import { IntegrationHarness } from "@/test-util/integration-harness";
import { TestDataGenerator } from "@/utils/utils";
import { env } from "cloudflare:test";
import { addDays } from "date-fns";
import { beforeEach, describe, expect, test } from "vitest";
import {
    type V1CreateUserRequest,
    type V1CreateUserResponse,
} from "../users/v1_create_user";
import { V1CreateApiKeyRequest, V1CreateApiKeyResponse } from "./v1_create_api_key";

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        docs?: string;
        requestId?: string;
    };
}

describe("V1 Create API Key Route", () => {
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

    // Helper function to create API key request data
    const createApiKeyData = (userId: number | string, customData = {}) => ({
        userId: typeof userId === 'string' ? parseInt(userId) : userId,
        name: "Test API Key",
        expiresAt: addDays(new Date(), 30).toISOString(),
        ...customData
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

        // Create initial API key for authentication
        const initialKeyResponse = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
            url: Routes.ApiKeys.create.path,
            body: createApiKeyData(response.body.id),
            headers: {
                "Content-Type": "application/json",
            },
        });

        validApiKey = initialKeyResponse.body.key;
        validUserId = createdUserId;
    });

    // describe("POST /v1/api-keys - Authentication", () => {
    //     test("should reject request without API key", async () => {
    //         const response = await harness.post<V1CreateApiKeyRequest, ErrorResponse>({
    //             url: Routes.ApiKeys.create.path,
    //             body: createApiKeyData(createdUserId),
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });

    //     test("should reject request with invalid API key", async () => {
    //         const response = await harness.post<V1CreateApiKeyRequest, ErrorResponse>({
    //             url: Routes.ApiKeys.create.path,
    //             body: createApiKeyData(createdUserId),
    //             headers: createAuthHeaders("invalid-api-key"),
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });
    // });

    describe("POST /v1/api-keys - Validation", () => {
        test("should require userId", async () => {
            const response = await harness.post<V1CreateApiKeyRequest, ErrorResponse>({
                url: Routes.ApiKeys.create.path,
                body: {
                    name: "Test Key",
                    userId: 0,
                    expiresAt: addDays(new Date(), 30).toISOString(),
                },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should require name", async () => {
            const response = await harness.post<V1CreateApiKeyRequest, ErrorResponse>({
                url: Routes.ApiKeys.create.path,
                body: {
                    name: "",
                    userId: parseInt(createdUserId),
                    expiresAt: addDays(new Date(), 30).toISOString(),
                },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should require valid expiration date", async () => {
            const response = await harness.post<V1CreateApiKeyRequest, ErrorResponse>({
                url: Routes.ApiKeys.create.path,
                body: {
                    userId: parseInt(createdUserId),
                    name: "Test Key",
                    expiresAt: "invalid-date",
                },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should reject expiration date in the past", async () => {
            const response = await harness.post<V1CreateApiKeyRequest, ErrorResponse>({
                url: Routes.ApiKeys.create.path,
                body: {
                    userId: parseInt(createdUserId),
                    name: "Test Key",
                    expiresAt: addDays(new Date(), -1).toISOString(),
                },
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });
    });

    describe("POST /v1/api-keys - Success Cases", () => {
        test("should successfully create new API key", async () => {
            const keyData = createApiKeyData(createdUserId);
            const response = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                url: Routes.ApiKeys.create.path,
                body: keyData,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                userId: parseInt(createdUserId),
                name: keyData.name,
                isActive: true,
                environment: "production",
                revoked: false,
            });
            expect(response.body.key).toMatch(/^sk_live_solomon_ai_/);

            expect(response.body.id).toBeDefined();
            expect(new Date(response.body.expiresAt)).toBeInstanceOf(Date);
        });

        test("should create key with custom name", async () => {
            const customName = "Custom Key Name";
            const response = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                url: Routes.ApiKeys.create.path,
                body: createApiKeyData(createdUserId, { name: customName }),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(customName);
        });

        test("should create multiple keys for same user", async () => {
            const responses = await Promise.all([
                harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                    url: Routes.ApiKeys.create.path,
                    body: createApiKeyData(createdUserId, { name: "Key 1" }),
                    headers: createAuthHeaders(),
                }),
                harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                    url: Routes.ApiKeys.create.path,
                    body: createApiKeyData(createdUserId, { name: "Key 2" }),
                    headers: createAuthHeaders(),
                }),
            ]);

            expect(responses.every(r => r.status === 200)).toBe(true);
            expect(responses[0].body.key).not.toBe(responses[1].body.key);
        });
    });

    describe("POST /v1/api-keys - Caching", () => {
        test("should cache created API key", async () => {
            const response = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                url: Routes.ApiKeys.create.path,
                body: createApiKeyData(createdUserId),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);

            // Verify key exists in cache by trying to use it immediately
            const verifyResponse = await harness.get<V1CreateApiKeyResponse>({
                url: `${Routes.ApiKeys.base.path}?userId=${createdUserId}`,
                headers: createAuthHeaders(response.body.key, createdUserId),
            });

            expect(verifyResponse.status).toBe(200);
        });
    });

    describe("POST /v1/api-keys - Cross-User Security", () => {
        test("should allow creation of API key for other users", async () => {
            // Create another user
            const secondUserResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                body: generator.generateUserData(),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // Create API key for second user using first user's auth
            const response = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                url: Routes.ApiKeys.create.path,
                body: createApiKeyData(secondUserResponse.body.id),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.userId).toBe(secondUserResponse.body.id);
        });
    });

    describe("POST /v1/api-keys - Concurrency", () => {
        test("should handle concurrent API key creation", async () => {
            const numberOfKeys = 5;
            const promises = Array(numberOfKeys).fill(null).map((_, i) =>
                harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                    url: Routes.ApiKeys.create.path,
                    body: createApiKeyData(createdUserId, { name: `Concurrent Key ${i}` }),
                    headers: createAuthHeaders(),
                })
            );

            const responses = await Promise.all(promises);

            expect(responses.every(r => r.status === 200)).toBe(true);

            // Verify all keys are unique
            const keys = responses.map(r => r.body.key);
            const uniqueKeys = new Set(keys);
            expect(uniqueKeys.size).toBe(numberOfKeys);
        });
    });
});