import { Providers } from "@/common/schema";
import { z } from "@hono/zod-openapi";
import { InstitutionSchema } from "../institutions/schema";

/**
 * Schema for account query parameters.
 * @property {string} [id] - GoCardLess reference id.
 * @property {Providers} provider - The provider of the account (e.g., Teller).
 * @property {string} [accessToken] - Teller & Plaid access token.
 * @property {string} [institutionId] - Plaid institution id.
 */
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
    example: Providers.Enum.teller,
  }),
  accessToken: z
    .string()
    .optional()
    .openapi({
      description: "Teller & Plaid access token",
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

/**
 * Schema for an individual account.
 * @property {string} id - Unique identifier for the account.
 * @property {string} name - Name of the account.
 * @property {('depository'|'credit'|'other_asset'|'loan'|'other_liability')} type - Type of the account.
 * @property {Object} balance - Current balance of the account.
 * @property {number} balance.amount - The balance amount.
 * @property {string} balance.currency - The currency of the balance.
 * @property {string} currency - The primary currency of the account.
 * @property {InstitutionSchema} institution - Details of the institution holding the account.
 * @property {string|null} enrollment_id - Enrollment ID, if applicable.
 */
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
        example: "add29d44-1b36-4bcc-b317-b2cbc73ab8e7",
      })
      .nullable(),
  })
  .openapi("AccountSchema");

/**
 * Schema for a list of accounts.
 * @property {AccountSchema[]} data - Array of account objects.
 */
export const AccountsSchema = z
  .object({
    data: z.array(AccountSchema),
  })
  .openapi("AccountsSchema");

/**
 * Schema for account balance query parameters.
 * @property {string} id - Account id.
 * @property {Providers} provider - The provider of the account (e.g., Teller).
 * @property {string} [accessToken] - Teller & Plaid access token.
 */
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
      example: Providers.Enum.teller,
    }),
    accessToken: z
      .string()
      .optional()
      .openapi({
        description: "Teller & Plaid access token",
        param: {
          name: "accessToken",
          in: "query",
        },
        example: "test_token_ky6igyqi3qxa4",
      }),
  })
  .openapi("AccountBalanceParamsSchema");

/**
 * Schema for account balance response.
 * @property {Object|null} data - Balance data object or null if not available.
 * @property {number} data.amount - The balance amount.
 * @property {string} data.currency - The currency of the balance.
 */
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

/**
 * Schema for delete account query parameters.
 * @property {string} accountId - Account id (GoCardLess).
 * @property {Providers} provider - The provider of the account (e.g., Teller).
 * @property {string} [accessToken] - Teller & Plaid access token.
 */
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
      example: Providers.Enum.teller,
    }),
    accessToken: z
      .string()
      .optional()
      .openapi({
        description: "Teller & Plaid access token",
        param: {
          name: "accessToken",
          in: "query",
        },
        example: "test_token_ky6igyqi3qxa4",
      }),
  })
  .openapi("DeleteAccountsParamsSchema");

/**
 * Schema for delete operation response.
 * @property {boolean} success - Indicates if the delete operation was successful.
 */
export const DeleteSchema = z
  .object({
    success: z.boolean().openapi({
      example: true,
    }),
  })
  .openapi("DeleteSchema");
