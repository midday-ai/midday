// config.test.ts

import { ApiConfig, getApiConfig } from "./config";

describe("API Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("ApiConfig interface", () => {
    it("should allow a valid configuration", () => {
      const config: ApiConfig = {
        apiUrl: "https://api.example.com",
        token: "secret-token",
        timeout: 5000,
        apiKey: "api-key-123",
      };

      expect(config).toHaveProperty("apiUrl");
      expect(config).toHaveProperty("token");
      expect(config).toHaveProperty("timeout");
      expect(config).toHaveProperty("apiKey");
    });

    it("should allow a configuration with only required fields", () => {
      const config: ApiConfig = {
        apiUrl: "https://api.example.com",
      };

      expect(config).toHaveProperty("apiUrl");
      expect(config).not.toHaveProperty("token");
      expect(config).not.toHaveProperty("timeout");
      expect(config).not.toHaveProperty("apiKey");
    });
  });

  describe("getApiConfig function", () => {
    it("should return default values when environment variables are not set", () => {
      const config = getApiConfig();

      expect(config).toEqual({
        apiUrl: "",
        token: undefined,
        timeout: undefined,
        apiKey: "",
      });
    });

    it("should return values from environment variables when set", () => {
      process.env.API_URL = "https://api.test.com";
      process.env.API_TOKEN = "test-token";
      process.env.API_TIMEOUT = "3000";
      process.env.API_KEY = "test-api-key";

      const config = getApiConfig();

      expect(config).toEqual({
        apiUrl: "https://api.test.com",
        token: "test-token",
        timeout: 3000,
        apiKey: "test-api-key",
      });
    });

    it("should handle missing optional environment variables", () => {
      process.env.API_URL = "https://api.test.com";
      // API_TOKEN and API_TIMEOUT are intentionally not set

      const config = getApiConfig();

      expect(config).toEqual({
        apiUrl: "https://api.test.com",
        token: undefined,
        timeout: undefined,
        apiKey: "",
      });
    });

    it("should convert API_TIMEOUT to a number", () => {
      process.env.API_URL = "https://api.test.com";
      process.env.API_TIMEOUT = "5000";

      const config = getApiConfig();

      expect(config.timeout).toBe(5000);
      expect(typeof config.timeout).toBe("number");
    });

    it("should handle invalid API_TIMEOUT", () => {
      process.env.API_URL = "https://api.test.com";
      process.env.API_TIMEOUT = "invalid";

      const config = getApiConfig();

      expect(config.timeout).toBe(NaN);
    });
  });
});
