import { z } from "@hono/zod-openapi";

export const LinkBodySchema = z
  .object({
    userId: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    language: z.string().openapi({
      example: "en",
    }),
  })
  .openapi("Auth");

export const LinkSchema = z
  .object({
    link_token: z.string().openapi({
      example: "ojwmef9823f892n9h98h2efoqed9823hdodfcoj13er92hef",
    }),
    expiration: z.string().openapi({
      example: "2024-06-01",
    }),
  })
  .openapi("Auth");

export const ExchangeBodySchema = z
  .object({
    token: z.string().openapi({
      example: "ojwmef9823f892n9h98h2efoqed9823hdodfcoj13er92hef",
    }),
  })
  .openapi("Auth");

export const ExchangeSchema = z
  .object({
    access_token: z.string().openapi({
      example: "access_9293961c",
    }),
  })
  .openapi("Auth");
