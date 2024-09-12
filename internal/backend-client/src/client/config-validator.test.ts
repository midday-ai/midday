// config-validator.test.ts

import { ApiConfig } from "./config";
import { ConfigValidator } from "./config-validator";
import { Logger } from "./logger";

// Mock the Logger
jest.mock("./logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe("ConfigValidator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateApiConfig", () => {
    it("should not throw for a valid configuration", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        token: "valid.jwt.token",
        timeout: 5000,
        apiKey: "valid-api-key-12345678901234567890",
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });

    it("should throw for missing configuration", () => {
      expect(() => ConfigValidator.validateApiConfig(undefined as any)).toThrow(
        "API configuration is missing",
      );
    });
  });

  describe("validateApiUrl", () => {
    it("should throw for missing API URL", () => {
      const invalidConfig: ApiConfig = { apiUrl: "" };
      expect(() => ConfigValidator.validateApiConfig(invalidConfig)).toThrow(
        "API URL is required",
      );
    });

    it("should throw for invalid API URL format", () => {
      const invalidConfig: ApiConfig = { apiUrl: "invalid-url" };
      expect(() => ConfigValidator.validateApiConfig(invalidConfig)).toThrow(
        "API URL must start with http:// or https://",
      );
    });

    it("should accept valid http URL", () => {
      const validConfig: ApiConfig = { apiUrl: "http://api.example.com" };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });

    it("should accept valid https URL", () => {
      const validConfig: ApiConfig = { apiUrl: "https://api.example.com" };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });
  });

  describe("validateTimeout", () => {
    it("should throw for negative timeout", () => {
      const invalidConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        timeout: -1,
      };
      expect(() => ConfigValidator.validateApiConfig(invalidConfig)).toThrow(
        "Timeout must be a positive number",
      );
    });

    it("should throw for zero timeout", () => {
      const invalidConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        timeout: 0,
      };
      expect(() => ConfigValidator.validateApiConfig(invalidConfig)).toThrow(
        "Timeout must be a positive number",
      );
    });

    it("should accept valid positive timeout", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        timeout: 5000,
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });

    it("should accept undefined timeout", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        timeout: undefined,
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });
  });

  describe("validateToken", () => {
    it("should throw for invalid token format", () => {
      const invalidConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        token: "invalid-token",
      };
      expect(() => ConfigValidator.validateApiConfig(invalidConfig)).toThrow(
        "Invalid token format",
      );
    });

    it("should accept valid token format", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        token: "valid.jwt.token",
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });

    it("should accept undefined token", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        token: undefined,
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });
  });

  describe("validateApiKey", () => {
    it("should throw for invalid API key format", () => {
      const invalidConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "short",
      };
      expect(() => ConfigValidator.validateApiConfig(invalidConfig)).toThrow(
        "Invalid API key format",
      );
    });

    it("should accept valid API key format", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        apiKey: "valid-api-key-12345678901234567890",
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });

    it("should accept undefined API key", () => {
      const validConfig: ApiConfig = {
        apiUrl: "https://api.example.com",
        apiKey: undefined,
      };
      expect(() =>
        ConfigValidator.validateApiConfig(validConfig),
      ).not.toThrow();
    });
  });

  describe("logAndThrow", () => {
    it("should log error and throw with the provided message", () => {
      const expectedErrorMessage = "API configuration is missing";
      expect(() => ConfigValidator.validateApiConfig(undefined as any)).toThrow(
        expectedErrorMessage,
      );
      expect(Logger.error).toHaveBeenCalledWith(
        "Invalid API configuration",
        expect.any(Error),
      );
    });
  });
});
