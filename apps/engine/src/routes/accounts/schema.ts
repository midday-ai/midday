import { z } from "@hono/zod-openapi";

export const AccountsParamsSchema = z.object({
  id: z
    .string()
    .optional()
    .openapi({
      description: "GoCardLess account id",
      param: {
        name: "id",
        in: "query",
      },
      example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    }),
  countryCode: z
    .string()
    .optional()
    .openapi({
      description: "GoCardLess country code",
      param: {
        name: "countryCode",
        in: "query",
      },
      example: "SE",
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

export const AccountSchema = z
  .object({
    id: z.string().openapi({
      example: "123",
    }),
    name: z.string().openapi({
      example: "John Doe",
    }),
    age: z.number().openapi({
      example: 42,
    }),
  })
  .openapi("Account");

export const AccountsSchema = z
  .object({
    data: z.array(AccountSchema),
  })
  .openapi("Accounts");
