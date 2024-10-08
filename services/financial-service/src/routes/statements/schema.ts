import { Providers } from "@/common/schema";
import { z } from "@hono/zod-openapi";

/**
 * Schema for the parameters required to fetch statements.
 * @property {Providers} provider - The financial data provider (e.g., Plaid).
 * @property {string} accessToken - The access token for the provider's API.
 * @property {string} accountId - The ID of the account to fetch statements for.
 * @property {string} userId - The ID of the user associated with the account.
 * @property {string} teamId - The ID of the team associated with the user.
 */
export const StatementsParamsSchema = z.object({
  provider: Providers.openapi({
    example: Providers.Enum.plaid,
  }),
  accessToken: z.string().openapi({
    description: "Plaid access token",
    param: {
      name: "accessToken",
      in: "query",
    },
    example: "access-sandbox-123456-abcdef",
  }),
  accountId: z.string().openapi({
    description: "Account ID",
    param: {
      name: "accountId",
      in: "query",
    },
    example: "5f7a7464d6e268055f17e3a5",
  }),
  userId: z.string().openapi({
    description: "User ID",
    param: {
      name: "userId",
      in: "query",
    },
    example: "user_12345",
  }),
  teamId: z.string().openapi({
    description: "Team ID",
    param: {
      name: "teamId",
      in: "query",
    },
    example: "team_67890",
  }),
});

/**
 * Schema representing a single statement.
 * @property {string} account_id - The ID of the account the statement belongs to.
 * @property {string} statement_id - The unique identifier for the statement.
 * @property {string} month - The month of the statement (format: MM).
 * @property {string} year - The year of the statement (format: YYYY).
 */
export const StatementSchema = z.object({
  account_id: z.string(),
  statement_id: z.string(),
  month: z.string(),
  year: z.string(),
});

/**
 * Schema representing a collection of statements.
 * @property {StatementSchema[]} data - An array of statement objects.
 */
export const StatementsSchema = z.object({
  data: z.array(StatementSchema),
});

/**
 * Schema for the parameters required to fetch a statement PDF.
 * @property {Providers} provider - The financial data provider (e.g., Plaid).
 * @property {string} accessToken - The access token for the provider's API.
 * @property {string} statementId - The ID of the specific statement to fetch.
 * @property {string} accountId - The ID of the account the statement belongs to.
 * @property {string} userId - The ID of the user associated with the account.
 * @property {string} teamId - The ID of the team associated with the user.
 */
export const StatementPdfParamsSchema = z.object({
  provider: Providers.openapi({
    example: Providers.Enum.plaid,
  }),
  accessToken: z.string().openapi({
    description: "Plaid access token",
    param: {
      name: "accessToken",
      in: "query",
    },
    example: "access-sandbox-123456-abcdef",
  }),
  statementId: z.string().openapi({
    description: "Statement ID",
    param: {
      name: "statementId",
      in: "query",
    },
    example: "abcdef123456",
  }),
  accountId: z.string().openapi({
    description: "Account ID",
    param: {
      name: "accountId",
      in: "query",
    },
    example: "5f7a7464d6e268055f17e3a5",
  }),
  userId: z.string().openapi({
    description: "User ID",
    param: {
      name: "userId",
      in: "query",
    },
    example: "user_12345",
  }),
  teamId: z.string().openapi({
    description: "Team ID",
    param: {
      name: "teamId",
      in: "query",
    },
    example: "team_67890",
  }),
});
