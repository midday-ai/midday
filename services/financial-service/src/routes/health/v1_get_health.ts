import { openApiErrorResponses as ErrorResponses, ServiceApiError } from "@/errors";
import { App } from "@/hono/app";
import { Provider } from "@/providers";
import { getHealthCheck } from "@/utils/search";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { HealthSchema } from "./schema";

/**
 * OpenAPI route configuration for the health check endpoint.
 * 
 * This route defines the API contract for the health check endpoint, including:
 * - HTTP method: GET
 * - Path: "/"
 * - Tags: ["apis"]
 * - Operation ID: "healthCheckApi"
 * - Summary: "Health"
 * - Response schemas for success (200) and error cases
 */
const route = createRoute({
    tags: ["api", "health"],
    operationId: "healthCheckApi",
    method: "get",
    path: "/v1/api.health",
    summary: "Health",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: HealthSchema,
                },
            },
            description: "Retrieve health",
        },
        ...ErrorResponses
    },
});

/**
 * Type representing the health check API route.
 * 
 * This type is derived from the `route` constant and can be used
 * for type checking and inference in other parts of the application
 * that interact with this route.
 */
export type V1ApisGetHealthApiRoute = typeof route;

/**
 * Type representing the response of the health check API.
 * 
 * This type is inferred from the success response schema (200) defined in the route.
 * It represents the structure of the JSON response body returned by the health check endpoint.
 */
export type V1ApisGetHealthApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the health check endpoint with the application.
 * 
 * This function sets up the OpenAPI route handler for the health check endpoint.
 * It performs the following operations:
 * 1. Retrieves environment variables
 * 2. Initializes a Provider instance
 * 3. Checks the health of various services (KV, TELLER_CERT, STORAGE)
 * 4. Checks the health of the search service
 * 5. Combines all health check results
 * 6. Throws an error if any service is unhealthy
 * 7. Returns a JSON response with the health status of all services
 * 
 * @param app - The Hono application instance to which the route will be added.
 * @throws {ServiceApiError} Throws an error if any service is unhealthy.
 */
export const registerV1GetHealth = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);

        const api = new Provider();

        const providers = await api.getHealthCheck({
            kv: c.env.KV,
            fetcher: c.env.TELLER_CERT,
            r2: c.env.STORAGE,
            envs,
        });

        const search = await getHealthCheck(envs);

        const allServices = {
            ...providers,
            search,
        };

        const isHealthy = Object.values(allServices).every(
            (service) => service.healthy,
        );

        if (!isHealthy) {
            throw new ServiceApiError({
                message: "Service unhealthy",
                code: "INTERNAL_SERVER_ERROR",
            });
        }

        return c.json(
            {
                data: allServices,
            },
            200,
        );
    });
};