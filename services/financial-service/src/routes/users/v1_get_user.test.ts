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
import { V1GetUserResponse } from "./v1_get_user";

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        docs?: string;
        requestId?: string;
    };
}

describe("V1 Get User Route", () => {
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

        validApiKey = apiKeyResponse.body.key;
        validUserId = createdUserId;
    });

    // describe("GET /v1/users/:id - Authentication", () => {
    //     test("should reject request without API key", async () => {
    //         const response = await harness.get<ErrorResponse>({
    //             url: Routes.Users.get.path.replace("{id}", createdUserId),
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });

    //     test("should reject request without User ID", async () => {
    //         const response = await harness.get<ErrorResponse>({
    //             url: Routes.Users.get.path.replace("{id}", createdUserId),
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 "X-API-Key": validApiKey,
    //             },
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });

    //     test("should reject request with invalid API key", async () => {
    //         const response = await harness.get<ErrorResponse>({
    //             url: Routes.Users.get.path.replace("{id}", createdUserId),
    //             headers: createAuthHeaders("invalid-api-key", validUserId),
    //         });

    //         expect(response.status).toBe(401);
    //         expect(response.body.error.message).toBe("Missing or invalid authentication headers");
    //     });
    // });

    describe("GET /v1/users/:id - Error Cases", () => {
        test("should return 404 for non-existent user", async () => {
            const nonExistentId = "999999";
            const response = await harness.get<ErrorResponse>({
                url: Routes.Users.get.path.replace("{id}", nonExistentId),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(404);
            expect(response.body.error.code).toBe("NOT_FOUND");
            expect(response.body.error.message).toBe("User not found");
        });

        test("should return 400 for invalid user ID format", async () => {
            const invalidId = "not-a-number";
            const response = await harness.get<ErrorResponse>({
                url: Routes.Users.get.path.replace("{id}", invalidId),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe("BAD_REQUEST");
            expect(response.body.error.message).toBe("Invalid user ID");
        });
    });

    describe("GET /v1/users/:id - Success Cases", () => {
        test("should successfully retrieve an existing user", async () => {
            const response = await harness.get<V1GetUserResponse>({
                url: Routes.Users.get.path.replace("{id}", createdUserId),
                headers: createAuthHeaders(),
            });

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(createdUserId);
            expect(response.body.name).toBeDefined();
            expect(response.body.email).toBeDefined();
            expect(response.body.createdAt).toBeDefined();
            expect(response.body.updatedAt).toBeDefined();
        });

        test("should return consistent data for repeated requests", async () => {
            const firstResponse = await harness.get<V1GetUserResponse>({
                url: Routes.Users.get.path.replace("{id}", createdUserId),
                headers: createAuthHeaders(),
            });

            const secondResponse = await harness.get<V1GetUserResponse>({
                url: Routes.Users.get.path.replace("{id}", createdUserId),
                headers: createAuthHeaders(),
            });

            expect(firstResponse.status).toBe(200);
            expect(secondResponse.status).toBe(200);
            expect(firstResponse.body).toEqual(secondResponse.body);
        });
    });

    describe("GET /v1/users/:id - Cache Behavior", () => {
        test("should use cached authentication for repeated requests", async () => {
            const startTime = Date.now();

            const [firstResponse, secondResponse] = await Promise.all([
                harness.get<V1GetUserResponse>({
                    url: Routes.Users.get.path.replace("{id}", createdUserId),
                    headers: createAuthHeaders(),
                }),
                harness.get<V1GetUserResponse>({
                    url: Routes.Users.get.path.replace("{id}", createdUserId),
                    headers: createAuthHeaders(),
                }),
            ]);

            const duration = Date.now() - startTime;

            expect(firstResponse.status).toBe(200);
            expect(secondResponse.status).toBe(200);
            expect(duration).toBeLessThan(100); // Cached request should be faster
        });
    });
});