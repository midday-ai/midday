import { z } from "zod";
import { errorSchemaFactory } from "./http";

/**
 * OpenAPI error response definitions for common HTTP status codes.
 *
 * This object provides standardized error responses for use in OpenAPI specifications.
 * Each key represents an HTTP status code, and its value contains the description and
 * schema for the corresponding error response.
 *
 * @property {Object} 400 - Bad Request error response
 * @property {Object} 401 - Unauthorized error response
 * @property {Object} 403 - Forbidden error response
 * @property {Object} 404 - Not Found error response
 * @property {Object} 409 - Conflict error response
 * @property {Object} 429 - Too Many Requests error response
 * @property {Object} 500 - Internal Server Error response
 */
export const openApiErrorResponses = {
  /**
   * 400 Bad Request error response
   * @property {string} description - Detailed explanation of the 400 error
   * @property {Object} content - Schema for the error response body
   */
  400: {
    description:
      "The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["BAD_REQUEST"])).openapi(
          "ErrBadRequest",
        ),
      },
    },
  },
  401: {
    description: `Although the HTTP standard specifies "unauthorized", semantically this response means "unauthenticated". That is, the client must authenticate itself to get the requested response.`,
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["UNAUTHORIZED"])).openapi(
          "ErrUnauthorized",
        ),
      },
    },
  },
  403: {
    description:
      "The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource. Unlike 401 Unauthorized, the client's identity is known to the server.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["FORBIDDEN"])).openapi(
          "ErrForbidden",
        ),
      },
    },
  },
  404: {
    description:
      "The server cannot find the requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist. Servers may also send this response instead of 403 Forbidden to hide the existence of a resource from an unauthorized client. This response code is probably the most well known due to its frequent occurrence on the web.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["NOT_FOUND"])).openapi(
          "ErrNotFound",
        ),
      },
    },
  },
  409: {
    description:
      "This response is sent when a request conflicts with the current state of the server.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["CONFLICT"])).openapi("ErrConflict"),
      },
    },
  },
  429: {
    description: `The user has sent too many requests in a given amount of time ("rate limiting")`,
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["TOO_MANY_REQUESTS"])).openapi(
          "ErrTooManyRequests",
        ),
      },
    },
  },
  500: {
    description:
      "The server has encountered a situation it does not know how to handle.",
    content: {
      "application/json": {
        schema: errorSchemaFactory(z.enum(["INTERNAL_SERVER_ERROR"])).openapi(
          "ErrInternalServerError",
        ),
      },
    },
  },
};
