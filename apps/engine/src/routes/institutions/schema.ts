import { Providers } from "@engine/common/schema";
import { ALL_COUNTRIES } from "@engine/utils/countries";
import { z } from "@hono/zod-openapi";

export const InstitutionSchema = z
  .object({
    id: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    name: z.string().openapi({
      example: "Wells Fargo Bank",
    }),
    logo: z
      .string()
      .openapi({
        example:
          "https://cdn.midday.ai/institution/9293961c-df93-4d6d-a2cc-fc3e353b2d10.jpg",
      })
      .nullable(),
    available_history: z
      .number()
      .optional()
      .openapi({
        example: 365,
      })
      .nullable(),
    maximum_consent_validity: z
      .number()
      .openapi({
        example: 365,
      })
      .optional()
      .nullable(),
    type: z
      .enum(["personal", "business"])
      .openapi({
        example: "personal",
      })
      .nullable()
      .optional(),
    popularity: z
      .number()
      .openapi({
        example: 1,
      })
      .optional(),
    country: z
      .string()
      .openapi({
        example: "GB",
      })
      .optional(),
    provider: Providers.openapi({
      example: Providers.enum.teller,
    }).optional(),
  })
  .openapi("InstitutionSchema");

export const InstitutionsSchema = z
  .object({
    data: z.array(InstitutionSchema),
  })
  .openapi("InstitutionsSchema");

export const UpdateUsageParamsSchema = z
  .object({
    id: z.string().openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: "STARLING_SRLGGB3L",
    }),
  })
  .openapi("UpdateUsageParamsSchema");

export const UpdateUsageSchema = z
  .object({
    data: InstitutionSchema,
  })
  .openapi("UpdateUsageSchema");

export const InstitutionParamsSchema = z
  .object({
    q: z
      .string()
      .optional()
      .openapi({
        description: "Search query",
        param: {
          name: "q",
          in: "query",
        },
        example: "Swedbank",
      }),
    limit: z
      .string()
      .optional()
      .openapi({
        description: "Limit results",
        param: {
          name: "limit",
          in: "query",
        },
        example: "50",
      }),
    countryCode: z.enum(ALL_COUNTRIES as [string, ...string[]]).openapi({
      description: "Country code",
      param: {
        name: "countryCode",
        in: "query",
      },
      example: ALL_COUNTRIES.at(1),
    }),
  })
  .openapi("InstitutionParamsSchema");

export const InstitutionByIdParamsSchema = z
  .object({
    id: z.string().openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
  })
  .openapi("InstitutionByIdParamsSchema");
