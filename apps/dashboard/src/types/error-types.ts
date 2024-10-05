/**
 * Enum representing various error types in the API.
 * @enum {string}
 */
export enum ERROR_TYPE {
  /** Indicates that the requested user was not found in the system. */
  USER_NOT_FOUND = "USER_NOT_FOUND",

  /** Indicates that the user is not authenticated to perform the requested action. */
  USER_NOT_AUTHENTICATED = "USER_NOT_AUTHENTICATED",

  /** Indicates that the user does not exist in the system. */
  USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST",

  /** Indicates that the request is invalid or malformed. */
  INVALID_REQUEST = "INVALID_REQUEST",
}

/**
 * Custom error class for API request-related errors.
 * @extends Error
 */
export class APIRequestError extends Error {
  /**
   * Creates a new instance of APIRequestError.
   * @param {string} message - The error message describing the issue.
   */
  constructor(message: string) {
    super(message);
    /**
     * The name of the error class.
     * @type {string}
     */
    this.name = "AuthenticationError";
  }
}
