import { openApiErrorResponses as ErrorResponses } from "@/errors";
import { App } from "@/hono/app";
import { Routes } from "@/route-definitions/routes";
import { createErrorResponse } from "@/utils/error";
import { SearchClient } from "@/utils/search";
import { createRoute, z } from "@hono/zod-openapi";
import { env } from "hono/adapter";
import { InstitutionParamsSchema, InstitutionsSchema } from "./schema";
import { SearchResult } from "./types";

/**
 * OpenAPI route configuration for the Get Institutions API.
 * @constant
 */
const route = createRoute({
    tags: [...Routes.Institutions.base.tags],
    operationId: Routes.Institutions.base.operationId,
    security: [{ bearerAuth: [] }],
    method: Routes.Institutions.base.method,
    path: Routes.Institutions.base.path,
    summary: Routes.Institutions.base.summary,
    request: {
        query: InstitutionParamsSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: InstitutionsSchema,
                },
            },
            description: "Retrieve institutions",
        },
        ...ErrorResponses
    },
});

export type V1GetInstitutionApiRoute = typeof route;
export type V1GetInstitutionApiRequest = z.infer<
    (typeof route.request.query)
>;
export type V1GetInstitutionApiResponse = z.infer<
    (typeof route.responses)[200]["content"]["application/json"]["schema"]
>;

/**
 * Registers the Get Institutions API route with the application.
 * 
 * This function sets up an OpenAPI route that allows clients to search for and retrieve
 * institution data based on specified criteria.
 *
 * @param {App} app - The Hono application instance to register the route with.
 * 
 * @throws {Error} If there's an issue with the Typesense search or data processing.
 * 
 * @example
 * const app = new Hono();
 * registerV1GetInstitutionApi(app);
 */
export const registerV1GetInstitutionApi = (app: App) => {
    app.openapi(route, async (c) => {
        const envs = env(c);
        const { countryCode, q = "*", limit = "50" } = c.req.valid("query");

        const typesense = SearchClient(envs);

        /**
         * Search parameters for querying institutions.
         * @type {object}
         * @property {string} q - The search query string.
         * @property {string} query_by - The field to query by (set to "name").
         * @property {string} filter_by - The filter string for country code.
         * @property {number} limit - The maximum number of results to return.
         */
        const searchParameters = {
            q,
            query_by: "name",
            filter_by: `countries:=[${countryCode}]`,
            limit: +limit,
        };

        try {
            // Perform the search using Typesense
            const result = await typesense
                .collections("institutions")
                .documents()
                .search(searchParameters);

            // Convert the result to a string if it isn't already
            const resultString: string =
                typeof result === "string" ? result : JSON.stringify(result);

            // Parse the result string into a SearchResult object
            const data: SearchResult = JSON.parse(resultString);

            // Return the formatted institution data
            return c.json(
                {
                    data: data.hits?.map(({ document }) => ({
                        id: document.id,
                        name: document.name,
                        logo: document.logo ?? null,
                        popularity: document.popularity,
                        available_history: document.available_history
                            ? +document.available_history
                            : null,
                        provider: document.provider,
                    })),
                },
                200,
            );
        } catch (error) {
            // Handle any errors that occur during the search or data processing
            const { message, code } = createErrorResponse(error, c.get("requestId"));

            return c.json({
                error: {
                    message,
                    docs: "https://engineering-docs.solomon-ai.app/errors",
                    requestId: c.get("requestId"),
                    code,
                }
            }, 400);
        }
    });
};