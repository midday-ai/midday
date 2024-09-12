/**
 * Interface representing the configuration for the API service.
 */
export interface ApiConfig {
  /**
   * The base URL of the API.
   * This is a required field and should be a valid URL string.
   */
  apiUrl: string;

  /**
   * Optional authentication token.
   * If provided, it will be used for authenticating API requests.
   */
  token?: string;

  /**
   * Optional timeout for API requests in milliseconds.
   * If set, it defines the maximum time to wait for an API response.
   */
  timeout?: number;

  /**
   * Optional API key for authentication.
   * An alternative or additional authentication method to the token.
   */
  apiKey?: string;
}

/**
 * Retrieves the API configuration from environment variables.
 *
 * @returns {ApiConfig} An object containing the API configuration.
 *
 * @remarks
 * This function reads from the following environment variables:
 * - API_URL: The base URL of the API (required)
 * - API_TOKEN: The authentication token (optional)
 * - API_TIMEOUT: The timeout for API requests in milliseconds (optional)
 * - API_KEY: The API key for authentication (optional)
 *
 * If API_URL is not set, it defaults to an empty string.
 * If API_TIMEOUT is set, it's converted to a number.
 * If API_KEY is not set, it defaults to an empty string.
 */
export const getApiConfig = (): ApiConfig => {
  return {
    apiUrl: process.env.API_URL || "",
    token: process.env.API_TOKEN,
    timeout: process.env.API_TIMEOUT
      ? Number(process.env.API_TIMEOUT)
      : undefined,
    apiKey: process.env.API_KEY || "",
  };
};
