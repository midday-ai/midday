import { z } from "@hono/zod-openapi";

export const LinkBodySchema = z
  .object({
    institutionId: z.string().openapi({
      example: "REVOLUT_REVOGB21",
    }),
    redirect: z.string().openapi({
      example: "http://www.yourwebpage.com",
    }),
    agreement: z
      .string()
      .openapi({
        example: "2dea1b84-97b0-4cb4-8805-302c227587c8",
      })
      .nullable(),
  })
  .openapi("Auth");

export const LinkSchema = z
  .object({
    link: z.string().openapi({
      example:
        "https://ob.gocardless.com/psd2/start/3fa85f64-5717-4562-b3fc-2c963f66afa6/REVOLUT_REVOGB21",
    }),
  })
  .openapi("Auth");

export const ExchangeBodySchema = z
  .object({
    institutionId: z.string().openapi({
      example: "REVOLUT_REVOGB21",
    }),
    transactionTotalDays: z.string().openapi({
      example: "90",
    }),
  })
  .openapi("Auth");

export const ExchangeSchema = z
  .object({
    id: z.string().openapi({
      example: "2dea1b84-97b0-4cb4-8805-302c227587c8",
    }),
    access_valid_for_days: z.string().openapi({
      example: "90",
    }),
    max_historical_days: z.string().openapi({
      example: "90",
    }),
    institutionId: z.string().openapi({
      example: "REVOLUT_REVOGB21",
    }),
  })
  .openapi("Auth");
