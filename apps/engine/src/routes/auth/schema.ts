import { z } from "@hono/zod-openapi";

export const PlaidLinkBodySchema = z
  .object({
    userId: z.string().optional().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    language: z.string().optional().openapi({
      example: "en",
    }),
    accessToken: z.string().optional().openapi({
      example: "ojwmef9823f892n9h98h2efoqed9823hdodfcoj13er92hef",
      description: "Used when initiating the reconnect flow",
    }),
  })
  .openapi("PlaidLinkBodySchema");

export const PlaidLinkSchema = z
  .object({
    data: z.object({
      link_token: z.string().openapi({
        example: "ojwmef9823f892n9h98h2efoqed9823hdodfcoj13er92hef",
      }),
      expiration: z.string().openapi({
        example: "2024-06-01",
      }),
    }),
  })
  .openapi("PlaidLinkSchema");

export const PlaidExchangeBodySchema = z
  .object({
    token: z.string().openapi({
      example: "ojwmef9823f892n9h98h2efoqed9823hdodfcoj13er92hef",
    }),
  })
  .openapi("PlaidExchangeBodySchema");

export const PlaidExchangeSchema = z
  .object({
    data: z.object({
      access_token: z.string().openapi({
        example: "access_9293961c",
      }),
      item_id: z.string().openapi({
        example: "item_9293961c",
      }),
    }),
  })
  .openapi("PlaidExchangeSchema");

export const GoCardLessLinkBodySchema = z
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
    reference: z.string().optional().openapi({
      example: "1234567890",
    }),
  })
  .openapi("GoCardLessLinkBodySchema");

export const GoCardLessLinkSchema = z
  .object({
    data: z.object({
      link: z.string().openapi({
        example:
          "https://ob.gocardless.com/psd2/start/3fa85f64-5717-4562-b3fc-2c963f66afa6/REVOLUT_REVOGB21",
      }),
    }),
  })
  .openapi("GoCardLessLinkSchema");

export const GoCardLessExchangeBodySchema = z
  .object({
    institutionId: z.string().openapi({
      example: "REVOLUT_REVOGB21",
    }),
    transactionTotalDays: z.number().openapi({
      example: 90,
    }),
  })
  .openapi("GoCardLessExchangeBodySchema");

export const GoCardLessExchangeSchema = z
  .object({
    data: z.object({
      id: z.string().openapi({
        example: "2dea1b84-97b0-4cb4-8805-302c227587c8",
      }),
      access_valid_for_days: z.number().openapi({
        example: 90,
      }),
      max_historical_days: z.number().openapi({
        example: 90,
      }),
      institution_id: z.string().openapi({
        example: "REVOLUT_REVOGB21",
      }),
    }),
  })
  .openapi("GoCardLessExchangeSchema");

export const GoCardLessAgreementBodySchema = z
  .object({
    institutionId: z.string().openapi({
      example: "REVOLUT_REVOGB21",
    }),
    transactionTotalDays: z.number().openapi({
      example: 90,
    }),
  })
  .openapi("GoCardLessAgreementBodySchema");

export const GoCardLessAgreementSchema = z
  .object({
    data: z.object({
      id: z.string().openapi({
        example: "2dea1b84-97b0-4cb4-8805-302c227587c8",
      }),
      created: z.string().openapi({
        example: "2024-01-01",
      }),
      access_valid_for_days: z.number().openapi({
        example: 90,
      }),
      max_historical_days: z.number().openapi({
        example: 90,
      }),
      institution_id: z.string().openapi({
        example: "REVOLUT_REVOGB21",
      }),
      accepted: z.boolean().openapi({
        example: true,
      }),
    }),
  })
  .openapi("GoCardLessAgreementSchema");

export const PluggyLinkBodySchema = z
  .object({
    userId: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    environment: z.enum(["sandbox", "production"]).openapi({
      example: "production",
    }),
  })
  .openapi("PluggyLinkBodySchema");

export const PluggyLinkSchema = z
  .object({
    data: z.object({
      access_token: z.string().openapi({
        example: "ojwmef9823f892n9h98h2efoqed9823hdodfcoj13er92hef",
      }),
    }),
  })
  .openapi("PluggyLinkSchema");
