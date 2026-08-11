import { getApiUrl, getAppUrl, getCdnUrl, getEmailUrl } from "./envs";

describe("environment resolution helpers (packages/utils)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getAppUrl", () => {
    it("uses DASHBOARD_URL override when provided", () => {
      process.env.DASHBOARD_URL = "https://custom.app.com";
      expect(getAppUrl()).toBe("https://custom.app.com");
    });

    it("returns production URL when NODE_ENV is production", () => {
      delete process.env.DASHBOARD_URL;
      process.env.NODE_ENV = "production";
      expect(getAppUrl()).toBe("https://app.midday.ai");
    });

    it("returns localhost fallback in development", () => {
      delete process.env.DASHBOARD_URL;
      delete process.env.RAILWAY_ENVIRONMENT;
      process.env.NODE_ENV = "development";
      expect(getAppUrl()).toBe("http://localhost:3001");
    });
  });

  describe("getApiUrl and getCdnUrl", () => {
    it("returns static cdn URL", () => {
      expect(getCdnUrl()).toBe("https://cdn.midday.ai");
    });

    it("uses API_URL override when provided", () => {
      process.env.API_URL = "https://custom.api.com";
      expect(getApiUrl()).toBe("https://custom.api.com");
    });
  });
});
