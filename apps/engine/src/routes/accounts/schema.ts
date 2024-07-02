import { Providers } from "@/common/schema";
import { z } from "@hono/zod-openapi";
import { InstitutionSchema } from "../institutions/schema";

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
  provider: Providers.openapi({
    example: "teller",
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
    currency: z.string().openapi({
      example: "USD",
    }),
    provider: Providers.openapi({
      example: "teller",
    }),
    institution: InstitutionSchema.nullable(),
    enrollment_id: z
      .string()
      .openapi({
        example: "add29d44-1b36-4bcc-b317-b2cbc73ab8e7",
      })
      .nullable(),
  })
  .openapi("AccountSchema");

export const AccountsSchema = z
  .object({
    data: z.array(AccountSchema),
  })
  .openapi("AccountsSchema");

export const AccountBalanceParamsSchema = z.object({
  id: z.string().openapi({
    description: "Account id",
    param: {
      name: "id",
      in: "query",
    },
    example: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  }),
  provider: Providers.openapi({
    example: "teller",
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
});

export const AccountBalanceSchema = z.object({
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
});
