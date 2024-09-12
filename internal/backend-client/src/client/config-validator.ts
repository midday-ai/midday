// config-validator.ts
import { ApiConfig } from "./config";
import { Logger } from "./logger";

/**
 * ConfigValidator class for validating API configurations.
 */
export class ConfigValidator {
  /**
   * Validates the provided API configuration.
   * @param {ApiConfig} config - The API configuration to validate.
   * @throws {Error} If the configuration is invalid.
   */
  static validateApiConfig(config: ApiConfig): void {
    this.validateConfigExistence(config);
    this.validateApiUrl(config.apiUrl);
    this.validateTimeout(config.timeout);
    this.validateToken(config.token);
    this.validateApiKey(config.apiKey);
    // Add more validation calls here as needed
  }

  /**
   * Validates that the config object exists.
   * @param {ApiConfig} config - The API configuration to validate.
   * @throws {Error} If the configuration is missing.
   * @private
   */
  private static validateConfigExistence(config: ApiConfig): void {
    if (!config) {
      throw this.logAndThrow("API configuration is missing");
    }
  }

  /**
   * Validates the API URL.
   * @param {string | undefined} apiUrl - The API URL to validate.
   * @throws {Error} If the API URL is missing or invalid.
   * @private
   */
  private static validateApiUrl(apiUrl: string | undefined): void {
    if (!apiUrl) {
      throw this.logAndThrow("API URL is required");
    }
    if (!/^https?:\/\//i.test(apiUrl)) {
      throw this.logAndThrow("API URL must start with http:// or https://");
    }
  }

  /**
   * Validates the timeout value.
   * @param {number | undefined} timeout - The timeout value to validate.
   * @throws {Error} If the timeout is invalid.
   * @private
   */
  private static validateTimeout(timeout: number | undefined): void {
    if (
      timeout !== undefined &&
      (typeof timeout !== "number" || timeout <= 0)
    ) {
      throw this.logAndThrow("Timeout must be a positive number");
    }
  }

  /**
   * Validates the token format.
   * @param {string | undefined} token - The token to validate.
   * @throws {Error} If the token format is invalid.
   * @private
   */
  private static validateToken(token: string | undefined): void {
    if (
      token &&
      !/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/.test(token)
    ) {
      throw this.logAndThrow("Invalid token format");
    }
  }

  /**
   * Validates the API key format.
   * @param {string | undefined} apiKey - The API key to validate.
   * @throws {Error} If the API key format is invalid.
   * @private
   */
  private static validateApiKey(apiKey: string | undefined): void {
    if (apiKey !== undefined) {
      // Adjust this regex pattern based on your specific API key format
      const apiKeyPattern = /^[A-Za-z0-9_-]{20,40}$/;
      if (!apiKeyPattern.test(apiKey)) {
        throw this.logAndThrow("Invalid API key format");
      }
    }
  }

  /**
   * Logs an error message and throws an Error with the same message.
   * @param {string} message - The error message.
   * @returns {Error} The Error object to be thrown.
   * @private
   */
  private static logAndThrow(message: string): Error {
    Logger.error("Invalid API configuration", new Error(message));
    return new Error(message);
  }
}
