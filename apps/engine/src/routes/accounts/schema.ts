import { Providers } from "@engine/common/schema";
import { z } from "@hono/zod-openapi";
import { InstitutionSchema } from "../institutions/schema";

export const AccountsParamsSchema = z.object({
  id: z
    .string()
    .optional()
    .openapi({
      description: "GoCardLess reference id",
      param: {
        name: "id",
        in: "query",
      },
      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }),
  provider: Providers.openapi({
    example: Providers.enum.teller,
  }),
  accessToken: z
    .string()
    .optional()
    .openapi({
      description: "Teller or Plaid access token",
      param: {
        name: "accessToken",
        in: "query",
      },
      example: "test_token_ky6igyqi3qxa4",
    }),
  institutionId: z
    .string()
    .optional()
    .openapi({
      description: "Plaid institution id",
      param: {
        name: "institutionId",
        in: "query",
      },
      example: "ins_109508",
    }),
});

export const AccountSchema = z
  .object({
    id: z.string().openapi({
      example: "9293961c-df93-4d6d-a2cc-fc3e353b2d10",
    }),
    name: z.string().openapi({
      example: "Savings account",
    }),
    type: z
      .enum(["depository", "credit", "other_asset", "loan", "other_liability"])
      .openapi({
        example: "depository",
      }),
    balance: z.object({
      amount: z.number().openapi({
        example: 100.0,
      }),
      currency: z.string().openapi({
        example: "USD",
      }),
    }),
    currency: z.string().openapi({
      example: "USD",
    }),
    institution: InstitutionSchema,
    enrollment_id: z
      .string()
      .openapi({
        description: "Teller/Plaid enrollment id",
        example: "add29d44-1b36-4bcc-b317-b2cbc73ab8e7",
      })
      .nullable(),
    resource_id: z
      .string()
      .openapi({
        description: "GoCardLess reference id",
        example: "GBRGZX62Y8",
      })
      .nullable(),
    expires_at: z
      .string()
      .openapi({
        description: "EnableBanking or GoCardLess access valid until",
        example: "2024-03-06",
      })
      .nullable(),
  })
  .openapi("AccountSchema");

export const AccountsSchema = z
  .object({
    data: z.array(AccountSchema),
  })
  .openapi("AccountsSchema");

export const AccountBalanceParamsSchema = z
  .object({
    id: z.string().openapi({
      description: "Account id",
      param: {
        name: "id",
        in: "query",
      },
      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }),
    provider: Providers.openapi({
      example: Providers.enum.teller,
    }),
    accessToken: z
      .string()
      .optional()
      .openapi({
        description: "Teller or Plaid access token",
        param: {
          name: "accessToken",
          in: "query",
        },
        example: "test_token_ky6igyqi3qxa4",
      }),
  })
  .openapi("AccountBalanceParamsSchema");

export const AccountBalanceSchema = z
  .object({
    data: z
      .object({
        amount: z.number().openapi({
          example: 20000,
        }),
        currency: z.string().openapi({
          example: "USD",
        }),
      })
      .nullable(),
  })
  .openapi("AccountBalanceSchema");

export const DeleteAccountsParamsSchema = z
  .object({
    accountId: z.string().openapi({
      description: "Account id (GoCardLess)",
      param: {
        name: "accountId",
        in: "query",
      },
      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }),
    provider: Providers.openapi({
      example: Providers.enum.teller,
    }),
    accessToken: z
      .string()
      .optional()
      .openapi({
        description: "Teller or Plaid access token",
        param: {
          name: "accessToken",
          in: "query",
        },
        example: "test_token_ky6igyqi3qxa4",
      }),
  })
  .openapi("DeleteAccountsParamsSchema");

export const DeleteSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
    }),
  })
  .openapi("DeleteSchema");
