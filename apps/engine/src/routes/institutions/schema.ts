import { Providers } from "@/common/schema";
import { ALL_COUNTRIES } from "@/utils/countries";
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
          "https://cdn.midday.ai/institution/9293961c-df93-4d6d-a2cc-fc3e353b2d10.webp",
      })
      .nullable(),
    provider: Providers.openapi({
      example: "teller",
    }),
  })
  .openapi("InstitutionSchema");

export const InstitutionsSchema = z.object({
  data: z.array(InstitutionSchema).openapi("InstitutionsSchema"),
});

export const InstitutionParamsSchema = z.object({
  countryCode: z.enum(ALL_COUNTRIES as [string, ...string[]]).openapi({
    description: "Country code",
    param: {
      name: "countryCode",
      in: "query",
    },
    example: ALL_COUNTRIES.at(1),
  }),
});
