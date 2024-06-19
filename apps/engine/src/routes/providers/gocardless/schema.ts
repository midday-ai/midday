import { z } from "@hono/zod-openapi";

export const LinkParamsSchema = z
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
  .openapi("Providers");

export const LinkSchema = z
  .object({
    id: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    name: z.string().openapi({
      example: "Savings account",
    }),
    currency: z.string().openapi({
      example: "USD",
    }),

    enrollment_id: z
      .string()
      .openapi({
        example: "add29d44-1b36-4bcc-b317-b2cbc73ab8e7",
      })
      .nullable(),
  })
  .openapi("Providers");

export const ExchangeParamsSchema = z
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
  .openapi("Providers");

export const ExchangeSchema = z
  .object({
    id: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    name: z.string().openapi({
      example: "Savings account",
    }),
    currency: z.string().openapi({
      example: "USD",
    }),

    enrollment_id: z
      .string()
      .openapi({
        example: "add29d44-1b36-4bcc-b317-b2cbc73ab8e7",
      })
      .nullable(),
  })
  .openapi("Providers");
