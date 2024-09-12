import { Middleware } from "client-typescript-sdk";

/**
 * Interface for the API service.
 * Defines the contract for token management in the API service.
 */
export interface IApiService {
  /**
   * Sets the authentication token for the API service.
   * This token will be used for subsequent API requests.
   *
   * @param {string} token - The authentication token to set.
   * @returns {void}
   */
  setToken(token: string): void;

  /**
   * Retrieves the current authentication token.
   *
   * @returns {string | undefined} The current token if set, or undefined if no token is set.
   */
  getToken(): string | undefined;
}

/**
 * Type definition for a function that creates an API service.
 *
 * @param {string} apiUrl - The base URL for the API.
 * @param {string} [token] - Optional authentication token.
 * @param {Middleware[]} [middlewares=[]] - Optional array of middlewares to apply.
 * @returns {IApiService} An instance of the API service.
 */
export type ApiServiceFactory = (
  apiUrl: string,
  token?: string,
  middlewares?: Middleware[],
) => IApiService;
