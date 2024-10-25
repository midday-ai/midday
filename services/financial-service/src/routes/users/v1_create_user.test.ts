import { Routes } from "@/route-definitions/routes";
import { IntegrationHarness } from "@/test-util/integration-harness";
import { TestDataGenerator } from "@/utils/utils";
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, test } from "vitest";
import {
  V1CreateUserResponse400,
  V1CreateUserResponse409,
  type V1CreateUserRequest,
  type V1CreateUserResponse
} from "./v1_create_user";


describe("V1 Create User Route", () => {
  let harness: IntegrationHarness;
  let generator: TestDataGenerator;

  beforeEach(async (task) => {
    harness = await IntegrationHarness.init(task, env.DB);
    generator = new TestDataGenerator(`test-${Date.now()}`);
  });

  describe("POST /v1/users - Success Cases", () => {
    test("should successfully create a user with all valid fields", async () => {
      const createUserData = generator.generateUserData();

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });


      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email: createUserData.email,
        name: createUserData.name,
        status: "pending_verification",
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    test("should create user with null name", async () => {
      const createUserData: V1CreateUserRequest = {
        email: "nullname@example.com",
        name: null,
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.name).toBeNull();
    });

    test("should trim whitespace from email and name", async () => {
      const createUserData: V1CreateUserRequest = {
        email: "  trimmed@example.com  ",
        name: "  Trimmed User  ",
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("hey yoan here is the response", response.body);

      expect(response.status).toBe(400);
    });
  });

  describe("POST /v1/users - Validation Cases", () => {
    test("should reject invalid email format", async () => {
      const createUserData = {
        email: "invalid-email",
        name: "Test User",
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse400>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    test("should reject empty email", async () => {
      const createUserData = {
        email: "",
        name: "Test User",
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse400>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    test("should reject missing required fields", async () => {
      const createUserData = {
        name: "Test User",
        email: ""
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse400>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });

    test("should reject email exceeding maximum length", async () => {
      const createUserData = {
        email: "a".repeat(256) + "@example.com",
        name: "Test User",
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse400>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("BAD_REQUEST");
    });
  });

  describe("POST /v1/users - Duplicate Handling", () => {
    test("should reject duplicate email addresses", async () => {
      const createUserData: V1CreateUserRequest = {
        email: "duplicate@example.com",
        name: "First User",
      };

      // Create first user
      const firstResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(firstResponse.status).toBe(200);

      // Attempt to create second user with same email
      const secondResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse409>({
        url: Routes.Users.create.path,
        body: {
          ...createUserData,
          name: "Second User",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(secondResponse.status).toBe(409);
    });

    test("should handle case-insensitive email duplicates", async () => {
      const createUserData: V1CreateUserRequest = {
        email: "case@example.com",
        name: "First User",
      };

      // Create first user
      await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Attempt to create second user with same email in different case
      const duplicateResponse = await harness.post<V1CreateUserRequest, V1CreateUserResponse409>({
        url: Routes.Users.create.path,
        body: {
          ...createUserData,
          email: "CASE@EXAMPLE.COM",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(duplicateResponse.status).toBe(409);
    });
  });

  describe("POST /v1/users - Response Format", () => {
    test("should include all required response fields", async () => {
      const createUserData: V1CreateUserRequest = {
        email: "fields@example.com",
        name: "Field Test",
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("role");
      expect(response.body).toHaveProperty("avatarUrl");
      expect(response.body).toHaveProperty("bio");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    test("should have correct default values in response", async () => {
      const createUserData: V1CreateUserRequest = {
        email: "defaults@example.com",
        name: "Default Test",
      };

      const response = await harness.post<V1CreateUserRequest, V1CreateUserResponse>({
        url: Routes.Users.create.path,
        body: createUserData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);
    });
  });
});
