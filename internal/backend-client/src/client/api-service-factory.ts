// api-service-factory.ts
import { Middleware, PlaidAccountTransaction } from "client-typescript-sdk";

import { ApiService } from "./api-service";
import { ApiConfig, getApiConfig } from "./config";
import { ConfigValidator } from "./config-validator";
import { Logger } from "./logger";
import {
  addCustomHeaderMiddleware,
  errorHandlingMiddleware,
} from "./middleware";

/**
 * Factory class for creating and managing ApiService instances.
 * This class follows the Singleton pattern with additional flexibility.
 */
export class ApiServiceFactory {
  private static instance: ApiService | null = null;
  private static config: ApiConfig | null = null;
  private static middlewares: Middleware[] = [
    addCustomHeaderMiddleware,
    errorHandlingMiddleware,
  ];

  /**
   * Private constructor to prevent direct construction calls with the `new` operator.
   */
  private constructor() {}

  /**
   * Gets the ApiService instance. Creates a new instance if one doesn't exist or if forced.
   * @param {boolean} [forceNew=false] - If true, creates a new instance regardless of existing instance.
   * @returns {ApiService} The ApiService instance.
   * @throws {Error} If the configuration is invalid.
   */
  public static getInstance(forceNew = false): ApiService {
    if (!this.instance || forceNew) {
      if (!this.config) {
        this.config = getApiConfig();
      }
      ConfigValidator.validateApiConfig(this.config);
      this.instance = new ApiService(this.config, this.middlewares);
      Logger.info("ApiService instance created", {
        config: this.sanitizeConfig(this.config),
      });
    }
    return this.instance;
  }

  /**
   * Initializes the ApiService with a specific configuration and optional additional middlewares.
   * @param {ApiConfig} config - The configuration for the ApiService.
   * @param {Middleware[]} [additionalMiddlewares] - Additional middlewares to be used.
   * @throws {Error} If the configuration is invalid.
   */
  public static initialize(
    config: ApiConfig,
    additionalMiddlewares?: Middleware[],
  ): void {
    ConfigValidator.validateApiConfig(config);
    this.config = config;
    if (additionalMiddlewares) {
      this.middlewares = [...this.middlewares, ...additionalMiddlewares];
    }
    this.instance = new ApiService(config, this.middlewares);
    Logger.info("ApiService initialized", {
      config: this.sanitizeConfig(config),
    });
  }

  /**
   * Resets the ApiService instance and configuration.
   * Useful for testing or when a completely fresh instance is needed.
   */
  public static resetInstance(): void {
    this.instance = null;
    this.config = null;
    this.middlewares = [addCustomHeaderMiddleware, errorHandlingMiddleware];
    Logger.info("ApiService instance reset");
  }

  /**
   * Gets the current ApiConfig.
   * @returns {ApiConfig | null} The current configuration or null if not set.
   */
  public static getConfig(): ApiConfig | null {
    return this.config ? this.sanitizeConfig(this.config) : null;
  }

  /**
   * Adds a new middleware to the existing middleware stack.
   * @param {Middleware} middleware - The middleware to add.
   */
  public static addMiddleware(middleware: Middleware): void {
    this.middlewares.push(middleware);
    this.recreateInstance();
    Logger.info("New middleware added");
  }

  /**
   * Removes a specific middleware from the middleware stack.
   * @param {Middleware} middleware - The middleware to remove.
   * @returns {boolean} True if the middleware was found and removed, false otherwise.
   */
  public static removeMiddleware(middleware: Middleware): boolean {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
      this.recreateInstance();
      Logger.info("Middleware removed");
      return true;
    }
    return false;
  }

  /**
   * Creates a sanitized copy of the configuration, removing sensitive information.
   * @param {ApiConfig} config - The configuration to sanitize.
   * @returns {ApiConfig} A sanitized copy of the configuration.
   */
  private static sanitizeConfig(config: ApiConfig): ApiConfig {
    const sanitizedConfig = { ...config };
    if (sanitizedConfig.apiKey) {
      sanitizedConfig.apiKey = "******";
    }
    // Add more fields to sanitize if needed
    return sanitizedConfig;
  }

  /**
   * Recreates the ApiService instance with the current configuration and middlewares.
   * @private
   */
  private static recreateInstance(): void {
    if (this.config) {
      this.instance = new ApiService(this.config, this.middlewares);
      Logger.info("ApiService instance recreated with updated middlewares");
    }
  }
}
