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
  })
  .openapi("Institution");
