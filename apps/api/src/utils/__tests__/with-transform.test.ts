import { describe, expect, mock, test } from "bun:test";
import { z } from "zod";
import { withTransform } from "../with-transform";

// @ts-nocheck - Suppress Handler type signature errors (tests work correctly in runtime)

// Mock createSchema function for testing
function createTestSchema<T extends z.ZodTypeAny>(schema: T) {
  return {
    camel: schema,
    snake: schema,
    transformInput: (input: unknown) => {
      if (input === undefined) return undefined;
      return schema.parse(input);
    },
    transformOutput: <U>(data: U) => {
      // Simple snake_case conversion for testing
      const convertToSnakeCase = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(convertToSnakeCase);
        }
        if (obj !== null && typeof obj === "object") {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            const snakeKey = key.replace(
              /[A-Z]/g,
              (letter) => `_${letter.toLowerCase()}`,
            );
            result[snakeKey] = convertToSnakeCase(value);
          }
          return result;
        }
        return obj;
      };
      return convertToSnakeCase(data);
    },
  };
}

// Mock Hono context
function createMockContext(validData?: any) {
  const jsonMock = mock((data) => ({ response: "json called", data }));

  return {
    req: {
      valid: mock(() => validData || {}),
    },
    json: jsonMock,
    get: mock((key: string) => {
      if (key === "db") return {};
      if (key === "session") return { user: { id: "test-user" } };
      return undefined;
    }),
  };
}

describe("withTransform", () => {
  describe("Output transformation", () => {
    test("should transform camelCase to snake_case when schema parsing succeeds", async () => {
      const testSchema = createTestSchema(
        z.object({
          id: z.string(),
          fullName: z.string(),
          avatarUrl: z.string(),
        }),
      );

      const handler = withTransform({ output: testSchema }, async () => ({
        id: "123",
        fullName: "John Doe",
        avatarUrl: "https://example.com/avatar.jpg",
      }));

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        id: "123",
        full_name: "John Doe",
        avatar_url: "https://example.com/avatar.jpg",
      });
    });

    test("should handle schema parsing failure gracefully", async () => {
      const strictSchema = createTestSchema(
        z.object({
          id: z.string().uuid(), // This will fail with "123"
          fullName: z.string(),
        }),
      );

      const handler = withTransform({ output: strictSchema }, async () => ({
        id: "123", // Invalid UUID
        fullName: "John Doe",
        extraField: "should be preserved",
      }));

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      // Should still transform to snake_case even with parsing failure
      expect(mockContext.json).toHaveBeenCalledWith({
        id: "123",
        full_name: "John Doe",
        extra_field: "should be preserved",
      });
    });

    test("should handle nested objects correctly", async () => {
      const testSchema = createTestSchema(
        z.object({
          id: z.string(),
          userInfo: z.object({
            fullName: z.string(),
            avatarUrl: z.string(),
          }),
        }),
      );

      const handler = withTransform({ output: testSchema }, async () => ({
        id: "123",
        userInfo: {
          fullName: "John Doe",
          avatarUrl: "https://example.com/avatar.jpg",
        },
      }));

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        id: "123",
        user_info: {
          full_name: "John Doe",
          avatar_url: "https://example.com/avatar.jpg",
        },
      });
    });

    test("should handle arrays correctly", async () => {
      const testSchema = createTestSchema(
        z.object({
          userList: z.array(
            z.object({
              fullName: z.string(),
              avatarUrl: z.string(),
            }),
          ),
        }),
      );

      const handler = withTransform({ output: testSchema }, async () => ({
        userList: [
          {
            fullName: "John Doe",
            avatarUrl: "https://example.com/avatar1.jpg",
          },
          {
            fullName: "Jane Smith",
            avatarUrl: "https://example.com/avatar2.jpg",
          },
        ],
      }));

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        user_list: [
          {
            full_name: "John Doe",
            avatar_url: "https://example.com/avatar1.jpg",
          },
          {
            full_name: "Jane Smith",
            avatar_url: "https://example.com/avatar2.jpg",
          },
        ],
      });
    });
  });

  describe("Input transformation", () => {
    test("should transform input when input schema is provided", async () => {
      const inputSchema = createTestSchema(
        z.object({
          fullName: z.string(),
        }),
      );

      let transformedInput: any;
      const handler = withTransform(
        {
          input: inputSchema,
          inputSource: "json" as const,
        },
        async (c, input) => {
          transformedInput = input;
          return { success: true };
        },
      );

      const mockContext = createMockContext({ fullName: "John Doe" });
      // @ts-expect-error: test
      await handler(mockContext as any);

      expect(transformedInput).toEqual({ fullName: "John Doe" });
    });
  });

  describe("No transformation", () => {
    test("should return data as-is when no output schema is provided", async () => {
      const handler = withTransform(
        {}, // No output schema
        async () => ({
          id: "123",
          fullName: "John Doe", // Should remain camelCase
          avatarUrl: "https://example.com/avatar.jpg",
        }),
      );

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        id: "123",
        fullName: "John Doe", // No transformation
        avatarUrl: "https://example.com/avatar.jpg",
      });
    });

    test("should return Response object as-is if handler returns Response", async () => {
      const customResponse = new Response("Custom response");

      const handler = withTransform(
        { output: createTestSchema(z.object({ id: z.string() })) },
        async () => customResponse,
      );

      const mockContext = createMockContext();
      // @ts-expect-error: test
      const result = await handler(mockContext as any);

      expect(result).toBe(customResponse);
      expect(mockContext.json).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    test("should handle null and undefined values", async () => {
      const testSchema = createTestSchema(
        z.object({
          id: z.string(),
          optionalField: z.string().nullable(),
        }),
      );

      const handler = withTransform({ output: testSchema }, async () => ({
        id: "123",
        optionalField: null,
        undefinedField: undefined,
      }));

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith({
        id: "123",
        optional_field: null,
        undefined_field: undefined,
      });
    });

    test("should handle real-world database scenario", async () => {
      // Simulate a real database result with extra fields
      const userSchema = createTestSchema(
        z.object({
          id: z.string().uuid(),
          fullName: z.string(),
          email: z.string().email(),
          team: z
            .object({
              id: z.string().uuid(),
              name: z.string(),
            })
            .nullable(),
        }),
      );

      const handler = withTransform({ output: userSchema }, async () => ({
        id: "invalid-uuid", // Will cause strict parsing to fail
        fullName: "John Doe",
        email: "john@example.com",
        teamId: "team-456", // Extra field not in schema
        team: {
          id: "invalid-team-uuid", // Will cause parsing to fail
          name: "Test Team",
          inboxId: "inbox-123", // Extra field not in schema
          createdAt: "2024-01-01T00:00:00Z", // Extra field not in schema
        },
      }));

      const mockContext = createMockContext();
      // @ts-expect-error: test
      await handler(mockContext as any);

      // Should still transform correctly even with parsing failures
      expect(mockContext.json).toHaveBeenCalledWith({
        id: "invalid-uuid",
        full_name: "John Doe",
        email: "john@example.com",
        team_id: "team-456",
        team: {
          id: "invalid-team-uuid",
          name: "Test Team",
          inbox_id: "inbox-123",
          created_at: "2024-01-01T00:00:00Z",
        },
      });
    });
  });
});
