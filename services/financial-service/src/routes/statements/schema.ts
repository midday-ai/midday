import { Providers } from "@/common/schema";
import { z } from "@hono/zod-openapi";

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

export const StatementSchema = z.object({
  account_id: z.string(),
  statement_id: z.string(),
  month: z.string(),
  year: z.string(),
});

export const StatementsSchema = z.object({
  data: z.array(StatementSchema),
});

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
