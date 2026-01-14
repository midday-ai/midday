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
    iban: z
      .string()
      .openapi({
        description: "International Bank Account Number (EU/UK accounts)",
        example: "GB82WEST12345698765432",
      })
      .nullable(),
    subtype: z
      .string()
      .openapi({
        description: "Account subtype (checking, savings, credit_card, etc.)",
        example: "checking",
      })
      .nullable(),
    bic: z
      .string()
      .openapi({
        description: "Bank Identifier Code / SWIFT code",
        example: "WESTGB2L",
      })
      .nullable(),
    routing_number: z
      .string()
      .openapi({
        description: "ACH routing number (US accounts)",
        example: "021000021",
      })
      .nullable(),
    wire_routing_number: z
      .string()
      .openapi({
        description: "Wire routing number (US accounts, can differ from ACH)",
        example: "021000089",
      })
      .nullable(),
    account_number: z
      .string()
      .openapi({
        description: "Full account number (sensitive)",
        example: "1234567890",
      })
      .nullable(),
    sort_code: z
      .string()
      .openapi({
        description: "UK BACS sort code",
        example: "601613",
      })
      .nullable(),
    available_balance: z
      .number()
      .openapi({
        description: "Available credit (cards) or available funds (depository)",
        example: 4000,
      })
      .nullable(),
    credit_limit: z
      .number()
      .openapi({
        description: "Credit limit (credit cards only)",
        example: 5000,
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
    accountType: z
      .enum(["credit", "depository", "other_asset", "loan", "other_liability"])
      .optional()
      .openapi({
        description:
          "Account type for correct balance handling (credit cards use current, depository uses available)",
        param: {
          name: "accountType",
          in: "query",
        },
        example: "depository",
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
        available_balance: z
          .number()
          .nullable()
          .openapi({
            description: "Available credit (cards) or available funds",
            example: 4000,
          }),
        credit_limit: z
          .number()
          .nullable()
          .openapi({
            description: "Credit limit (credit cards only)",
            example: 5000,
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
