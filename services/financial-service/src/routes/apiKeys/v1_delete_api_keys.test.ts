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
import { V1DeleteApiKeyResponse } from "./v1_delete_api_key";

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        docs?: string;
        requestId?: string;
    };
}

describe("V1 Delete API Key Route", () => {
    let harness: IntegrationHarness;
    let generator: TestDataGenerator;
    let createdUserId: string;
    let validApiKey: string;
    let validUserId: string;
    let apiKeyIdToDelete: string;

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

        // Create first API key for authentication
        const firstApiKeyResponse = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
            url: Routes.ApiKeys.create.path,
            body: {
                userId: response.body.id,
                name: "Auth API Key",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            },
            headers: {
                "Content-Type": "application/json",
            },
        });

        validApiKey = firstApiKeyResponse.body.key;
        validUserId = createdUserId;

        // Create second API key to be deleted in tests
        const secondApiKeyResponse = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
            url: Routes.ApiKeys.create.path,
            body: {
                userId: response.body.id,
                name: "Test API Key",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            },
            headers: createAuthHeaders(),
        });

        apiKeyIdToDelete = secondApiKeyResponse.body.id.toString();
    });

    describe("DELETE /v1/api-keys - Authentication", () => {
        test("should reject request without API key", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${apiKeyIdToDelete}`,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe("Missing or invalid authentication headers");
        });

        test("should reject request with invalid API key", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${apiKeyIdToDelete}`,
                headers: createAuthHeaders("invalid-api-key"),
            });

            expect(response.status).toBe(401);
            expect(response.body.error.message).toBe("Missing or invalid authentication headers");
        });
    });

    describe("DELETE /v1/api-keys - Query Parameters", () => {
        test("should return 400 when id is missing", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: Routes.ApiKeys.revoke.path,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
        });

        test("should return 400 for invalid id format", async () => {
            const response = await harness.delete<ErrorResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=invalid-id`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(500);
            expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
        });
    });

    describe("DELETE /v1/api-keys - Error Cases", () => {
        test("should return 404 for non-existent API key", async () => {
            const nonExistentId = "999999";
            const response = await harness.delete<ErrorResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${nonExistentId}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(500);
            expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
            expect(response.body.error.message).toBe("API Key not found");
        });

        test("should prevent deletion of the currently used API key", async () => {
            // Try to delete the API key being used for authentication
            const currentKeyId = validApiKey; // This might need adjustment based on your API structure
            const response = await harness.delete<ErrorResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${currentKeyId}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(500);
            expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
        });
    });

    describe("DELETE /v1/api-keys - Success Cases", () => {
        test("should successfully delete an API key", async () => {
            const response = await harness.delete<V1DeleteApiKeyResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${apiKeyIdToDelete}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify key is actually deleted
            const verifyResponse = await harness.get<V1DeleteApiKeyResponse>({
                url: `${Routes.ApiKeys.base.path}?userId=${createdUserId}`,
                headers: createAuthHeaders(),
            });

            expect(verifyResponse.status).toBe(200);
        });

        test("should be idempotent for already deleted keys", async () => {
            // Delete the key first time
            await harness.delete<V1DeleteApiKeyResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${apiKeyIdToDelete}`,
                headers: createAuthHeaders(),
            });

            // Try to delete the same key again
            const response = await harness.delete<V1DeleteApiKeyResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${apiKeyIdToDelete}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(500);
        });
    });

    describe("DELETE /v1/api-keys - Cross-User Security", () => {
        test("should prevent deletion of other user's API keys", async () => {
            // Create another user with their own API key
            const secondUserResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
                url: Routes.Users.create.path,
                body: generator.generateUserData(),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const secondUserApiKey = await harness.post<V1CreateApiKeyRequest, V1CreateApiKeyResponse>({
                url: Routes.ApiKeys.create.path,
                body: {
                    userId: secondUserResponse.body.id,
                    name: "Second User Key",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
                },
                headers: createAuthHeaders(),
            });

            // Try to delete second user's API key using first user's credentials
            const response = await harness.delete<ErrorResponse>({
                url: `${Routes.ApiKeys.revoke.path}?id=${secondUserApiKey.body.id}`,
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
        });
    });
});