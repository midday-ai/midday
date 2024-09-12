import { Middleware } from "client-typescript-sdk";

import { ApiService } from "./api-service";
import { ApiServiceFactory } from "./api-service-factory";
import { ApiConfig, getApiConfig } from "./config";
import { ConfigValidator } from "./config-validator";
import { Logger } from "./logger";
import {
  addCustomHeaderMiddleware,
  errorHandlingMiddleware,
} from "./middleware";

jest.mock("./api-service");
jest.mock("./config");
jest.mock("./config-validator");
jest.mock("./logger");

describe("ApiServiceFactory", () => {
  const mockConfig: ApiConfig = {
    apiUrl: "http://test.com",
    apiKey: "test-key",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ApiServiceFactory["instance"] = null;
    ApiServiceFactory["config"] = null;
    ApiServiceFactory["middlewares"] = [
      addCustomHeaderMiddleware,
      errorHandlingMiddleware,
    ];
    (getApiConfig as jest.Mock).mockReturnValue(mockConfig);
  });

  describe("getInstance", () => {
    it("should create a new instance if none exists", () => {
      const instance = ApiServiceFactory.getInstance();
      expect(instance).toBeInstanceOf(ApiService);
      expect(ConfigValidator.validateApiConfig).toHaveBeenCalledWith(
        mockConfig,
      );
      expect(Logger.info).toHaveBeenCalledWith(
        "ApiService instance created",
        expect.any(Object),
      );
    });

    it("should return existing instance if one exists", () => {
      const instance1 = ApiServiceFactory.getInstance();
      const instance2 = ApiServiceFactory.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should create new instance if forceNew is true", () => {
      const instance1 = ApiServiceFactory.getInstance();
      const instance2 = ApiServiceFactory.getInstance(true);
      expect(instance1).not.toBe(instance2);
    });
  });

  describe("initialize", () => {
    it("should initialize with given config and middlewares", () => {
      const additionalMiddleware: Middleware = { pre: jest.fn() };
      ApiServiceFactory.initialize(mockConfig, [additionalMiddleware]);
      expect(ConfigValidator.validateApiConfig).toHaveBeenCalledWith(
        mockConfig,
      );
      expect(ApiServiceFactory["middlewares"]).toHaveLength(3);
      expect(Logger.info).toHaveBeenCalledWith(
        "ApiService initialized",
        expect.any(Object),
      );
    });
  });

  describe("resetInstance", () => {
    it("should reset instance, config and middlewares", () => {
      ApiServiceFactory.getInstance();
      ApiServiceFactory.resetInstance();
      expect(ApiServiceFactory["instance"]).toBeNull();
      expect(ApiServiceFactory["config"]).toBeNull();
      expect(ApiServiceFactory["middlewares"]).toHaveLength(2);
      expect(Logger.info).toHaveBeenCalledWith("ApiService instance reset");
    });
  });

  describe("getConfig", () => {
    it("should return sanitized config", () => {
      ApiServiceFactory.getInstance();
      const config = ApiServiceFactory.getConfig();
      expect(config).toEqual({ ...mockConfig, apiKey: "******" });
    });

    it("should return null if no config is set", () => {
      const config = ApiServiceFactory.getConfig();
      expect(config).toBeNull();
    });
  });

  describe("addMiddleware", () => {
    it("should add middleware and recreate instance", () => {
      const newMiddleware: Middleware = { pre: jest.fn() };
      ApiServiceFactory.getInstance();
      ApiServiceFactory.addMiddleware(newMiddleware);
      expect(ApiServiceFactory["middlewares"]).toHaveLength(3);
      expect(Logger.info).toHaveBeenCalledWith("New middleware added");
    });
  });

  describe("removeMiddleware", () => {
    it("should remove middleware if it exists and recreate instance", () => {
      ApiServiceFactory.getInstance();
      const result = ApiServiceFactory.removeMiddleware(
        addCustomHeaderMiddleware,
      );
      expect(result).toBe(true);
      expect(ApiServiceFactory["middlewares"]).toHaveLength(1);
      expect(Logger.info).toHaveBeenCalledWith("Middleware removed");
    });

    it("should return false if middleware does not exist", () => {
      const nonExistentMiddleware: Middleware = { pre: jest.fn() };
      const result = ApiServiceFactory.removeMiddleware(nonExistentMiddleware);
      expect(result).toBe(false);
    });
  });
});
