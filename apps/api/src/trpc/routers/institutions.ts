import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  getInstitutionById,
  getInstitutions,
  updateInstitutionUsage,
} from "@midday/db/queries";
import { createLoggerWithContext } from "@midday/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const logger = createLoggerWithContext("trpc:institutions");

const getInstitutionsSchema = z.object({
  q: z.string().optional(),
  countryCode: z.string(),
  limit: z.number().optional().default(50),
  excludeProviders: z
    .array(z.enum(["gocardless", "plaid", "teller", "enablebanking"]))
    .optional(),
});

const getInstitutionByIdSchema = z.object({
  id: z.string(),
});

const updateUsageSchema = z.object({ id: z.string() });

export const institutionsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getInstitutionsSchema)
    .query(async ({ input, ctx: { db } }) => {
      try {
        const results = await getInstitutions(db, {
          countryCode: input.countryCode,
          q: input.q,
          limit: input.limit,
          excludeProviders: input.excludeProviders,
        });

        return results.map((institution) => ({
          id: institution.id,
          name: institution.name,
          logo: institution.logo ?? null,
          popularity: institution.popularity,
          availableHistory: institution.availableHistory ?? null,
          maximumConsentValidity: institution.maximumConsentValidity ?? null,
          provider: institution.provider,
          type: (institution.type as "personal" | "business" | null) ?? null,
          country: institution.countries?.[0] ?? null,
        }));
      } catch (error) {
        logger.error("Failed to get institutions", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get institutions",
        });
      }
    }),

  getById: protectedProcedure
    .input(getInstitutionByIdSchema)
    .query(async ({ input, ctx: { db } }) => {
      const result = await getInstitutionById(db, { id: input.id });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Institution not found",
        });
      }

      return {
        id: result.id,
        name: result.name,
        logo: result.logo ?? null,
        provider: result.provider,
        availableHistory: result.availableHistory ?? null,
        maximumConsentValidity: result.maximumConsentValidity ?? null,
        popularity: result.popularity,
        type: (result.type as "personal" | "business" | null) ?? null,
        country: result.countries?.[0] ?? undefined,
      };
    }),

  updateUsage: protectedProcedure
    .input(updateUsageSchema)
    .mutation(async ({ input, ctx: { db } }) => {
      try {
        const result = await updateInstitutionUsage(db, { id: input.id });

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Institution not found",
          });
        }

        return {
          data: {
            id: result.id,
            name: result.name,
            logo: result.logo ?? null,
            availableHistory: result.availableHistory ?? null,
            maximumConsentValidity: result.maximumConsentValidity ?? null,
            popularity: result.popularity,
            provider: result.provider,
            type: result.type ?? null,
            country: result.countries?.[0] ?? undefined,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error("Failed to update institution usage", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update institution usage",
        });
      }
    }),
});
