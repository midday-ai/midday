import type { Bindings } from "@engine/common/bindings";
import { ErrorSchema } from "@engine/common/schema";
import { PlaidApi } from "@engine/providers/plaid/plaid-api";
import { createErrorResponse } from "@engine/utils/error";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { CountryCode } from "plaid";
import { env } from "hono/adapter";
import {
  InstitutionByIdParamsSchema,
  InstitutionParamsSchema,
  InstitutionSchema,
  InstitutionsSchema,
  UpdateUsageParamsSchema,
  UpdateUsageSchema,
} from "./schema";
import { excludedInstitutions } from "./utils";

const app = new OpenAPIHono<{ Bindings: Bindings }>()
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      summary: "Get Institutions",
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
        400: {
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
          description: "Returns an error",
        },
      },
    }),
    async (c) => {
      const envs = env(c);
      const { countryCode, q = "*", limit = "50" } = c.req.valid("query");

      const { mockInstitutions } = await import("./mock-data");
      const isInitialLoad = !q || q === "*";

      if (isInitialLoad) {
        // Show curated popular banks on initial load
        const filtered = mockInstitutions
          .filter((inst) => inst.countries.includes(countryCode))
          .filter((inst) => !excludedInstitutions.includes(inst.id))
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, +limit);

        return c.json(
          {
            data: filtered.map((inst) => ({
              id: inst.id,
              name: inst.name,
              logo: inst.logo,
              popularity: inst.popularity,
              available_history: inst.available_history,
              maximum_consent_validity: inst.maximum_consent_validity,
              provider: inst.provider,
              type: inst.type,
            })),
          },
          200,
        );
      }

      try {
        // Search Plaid for typed queries
        const plaid = new PlaidApi({ envs });
        const response = await plaid.institutionsSearch({
          query: q,
          countryCode: countryCode as CountryCode,
          limit: +limit,
        });

        const filtered = response.filter(
          (inst) => !excludedInstitutions.includes(inst.institution_id),
        );

        return c.json(
          {
            data: filtered.map((inst) => ({
              id: inst.institution_id,
              name: inst.name,
              logo: inst.logo ?? null,
              popularity: 0,
              available_history: null,
              maximum_consent_validity: null,
              provider: "plaid" as const,
              type: null,
            })),
          },
          200,
        );
      } catch (error) {
        // Fallback to mock data if Plaid search fails
        const query = q.toLowerCase();
        const filtered = mockInstitutions
          .filter((inst) => inst.countries.includes(countryCode))
          .filter((inst) => inst.name.toLowerCase().includes(query))
          .filter((inst) => !excludedInstitutions.includes(inst.id))
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, +limit);

        return c.json(
          {
            data: filtered.map((inst) => ({
              id: inst.id,
              name: inst.name,
              logo: inst.logo,
              popularity: inst.popularity,
              available_history: inst.available_history,
              maximum_consent_validity: inst.maximum_consent_validity,
              provider: inst.provider,
              type: inst.type,
            })),
          },
          200,
        );
      }
    },
  )
  .openapi(
    createRoute({
      method: "put",
      path: "/{id}/usage",
      summary: "Update Institution Usage",
      request: {
        params: UpdateUsageParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: UpdateUsageSchema,
            },
          },
          description: "Update institution usage",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
          description: "Returns an error",
        },
      },
    }),
    async (c) => {
      // Usage tracking was Typesense-only; return a no-op success
      const id = c.req.param("id");
      return c.json(
        {
          data: {
            id,
            name: "",
            logo: null,
            available_history: null,
            maximum_consent_validity: null,
            popularity: 0,
            provider: "plaid",
            type: null,
            country: undefined,
          },
        },
        200,
      );
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/:id",
      summary: "Get Institution by ID",
      request: {
        params: InstitutionByIdParamsSchema,
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: InstitutionSchema,
            },
          },
          description: "Retrieve institution by id",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
          description: "Institution not found",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorSchema,
            },
          },
          description: "Institution not found",
        },
      },
    }),
    async (c) => {
      const envs = env(c);
      const { id } = c.req.valid("param");

      try {
        const plaid = new PlaidApi({ envs });
        const { data } = await plaid.institutionsGetById(id);
        const inst = data.institution;

        return c.json(
          {
            id: inst.institution_id,
            name: inst.name,
            provider: "plaid" as const,
            logo: inst.logo ?? null,
            available_history: null,
            maximum_consent_validity: null,
            country: inst.country_codes?.at(0) ?? undefined,
            type: null,
            popularity: 0,
          },
          200,
        );
      } catch (error) {
        const errorResponse = createErrorResponse(error);
        return c.json(errorResponse, 404);
      }
    },
  );

export default app;
