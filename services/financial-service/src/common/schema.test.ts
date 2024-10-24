import { describe, expect, it } from "vitest";
import { HeadersSchema, Providers } from "./schema";

describe("Providers Schema", () => {
  it("should validate allowed provider values", () => {
    const validProviders = ["teller", "plaid", "gocardless", "stripe"];

    validProviders.forEach((provider) => {
      const result = Providers.safeParse(provider);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(provider);
      }
    });
  });

  it("should reject invalid provider values", () => {
    const invalidProviders = [
      { value: "TELLER", expectedCode: "invalid_enum_value" },
      { value: "invalid", expectedCode: "invalid_enum_value" },
      { value: "", expectedCode: "invalid_enum_value" },
      { value: 123, expectedCode: "invalid_type" },
      { value: null, expectedCode: "invalid_type" },
      { value: undefined, expectedCode: "invalid_type" },
      { value: {}, expectedCode: "invalid_type" },
      { value: [], expectedCode: "invalid_type" },
    ];

    invalidProviders.forEach(({ value, expectedCode }) => {
      const result = Providers.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues[0].code).toBe(expectedCode);
      }
    });
  });

  it("should expose valid enum values", () => {
    expect(Providers.options).toEqual([
      "teller",
      "plaid",
      "gocardless",
      "stripe",
    ]);
  });

  it("should match OpenAPI schema", () => {
    const schema = Providers._def;
    expect(schema.values).toEqual(["teller", "plaid", "gocardless", "stripe"]);
  });
});

describe("HeadersSchema", () => {
  it("should validate valid authorization headers", () => {
    const validHeaders = [
      { authorization: "Bearer TOKEN" },
      { authorization: "Bearer abc123" },
      { authorization: "Any valid string" },
      { authorization: "Bearer " + "a".repeat(1000) }, // long token
    ];

    validHeaders.forEach((headers) => {
      const result = HeadersSchema.safeParse(headers);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.authorization).toBe(headers.authorization);
      }
    });
  });

  it("should reject invalid authorization headers", () => {
    const invalidHeaders = [
      { value: {}, expectedCode: "invalid_type" },
      { value: { authorization: 123 }, expectedCode: "invalid_type" },
      { value: { authorization: null }, expectedCode: "invalid_type" },
      { value: { authorization: undefined }, expectedCode: "invalid_type" },
      { value: { authorization: {} }, expectedCode: "invalid_type" },
      { value: { authorization: [] }, expectedCode: "invalid_type" },
    ];

    invalidHeaders.forEach(({ value, expectedCode }) => {
      const result = HeadersSchema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.issues[0].code).toBe(expectedCode);
      }
    });
  });

  it("should validate object shape", () => {
    const validHeaders = {
      authorization: "Bearer TOKEN",
      extraField: "should be allowed", // Zod doesn't strip extra properties by default
    };

    const result = HeadersSchema.safeParse(validHeaders);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.authorization).toBe(validHeaders.authorization);
    }
  });

  it("should match OpenAPI schema", () => {
    const schema = HeadersSchema.shape.authorization._def.openapi;
    expect(schema?.metadata).toEqual({
      example: "Bearer SECRET",
    });
  });

  it("should correctly handle strict parsing", () => {
    const strictSchema = HeadersSchema.strict();
    const result = strictSchema.safeParse({
      authorization: 123,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("invalid_type");
    }
  });

  it("should validate required fields", () => {
    const result = HeadersSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe("invalid_type");
    }
  });

  it("should allow partial schema validation", () => {
    const partialSchema = HeadersSchema.partial();
    const result = partialSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
