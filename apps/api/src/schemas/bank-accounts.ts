import { z } from "zod";
import "zod-openapi/extend";

export const getBankAccountsSchema = z
  .object({
    enabled: z
      .boolean()
      .optional()
      .openapi({
        description: "Whether the bank account is enabled.",
        param: {
          in: "query",
        },
      }),
    manual: z
      .boolean()
      .optional()
      .openapi({
        description: "Whether the bank account is a manual account.",
        param: {
          in: "query",
        },
      }),
  })
  .optional()
  .openapi({
    description: "Query parameters for filtering bank accounts.",
    param: {
      in: "query",
    },
  });

export const bankAccountResponseSchema = z
  .object({
    id: z.string().uuid().openapi({
      description: "Unique identifier for the bank account.",
      example: "b7e6c2a0-1f2d-4c3b-9a8e-123456789abc",
    }),
    name: z.string().openapi({
      description: "Name of the bank account.",
      example: "Checking Account",
    }),
    currency: z.string().openapi({
      description: "Currency code of the bank account (e.g., USD, EUR).",
      example: "USD",
    }),
    type: z.string().openapi({
      description: "Type of the bank account (e.g., depository, credit).",
      example: "depository",
    }),
    enabled: z.boolean().openapi({
      description: "Whether the bank account is enabled.",
      example: true,
    }),
    balance: z.number().openapi({
      description: "Current balance of the bank account.",
      example: 1500.75,
    }),
    manual: z.boolean().openapi({
      description: "Whether the bank account is a manual account.",
      example: false,
    }),
  })
  .openapi({
    description: "A single bank account object response.",
    example: {
      id: "b7e6c2a0-1f2d-4c3b-9a8e-123456789abc",
      name: "Checking Account",
      currency: "USD",
      type: "depository",
      enabled: true,
      balance: 1500.75,
      manual: false,
    },
  });

export const bankAccountsResponseSchema = z
  .object({
    data: z.array(bankAccountResponseSchema).openapi({
      description: "Array of bank account objects.",
    }),
  })
  .openapi({
    description: "Response containing a list of bank accounts.",
  });

export const deleteBankAccountSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the bank account.",
    example: "b7e6c2a0-1f2d-4c3b-9a8e-123456789abc",
  }),
});

export const getBankAccountByIdSchema = z.object({
  id: z.string().uuid().openapi({
    description: "The unique identifier of the bank account.",
    example: "b7e6c2a0-1f2d-4c3b-9a8e-123456789abc",
  }),
});

export const updateBankAccountSchema = z
  .object({
    id: z.string().uuid().optional().openapi({
      description: "The unique identifier of the bank account.",
      example: "b7e6c2a0-1f2d-4c3b-9a8e-123456789abc",
    }),
    name: z.string().optional().openapi({
      description: "The name of the bank account.",
      example: "Checking Account",
    }),
    enabled: z.boolean().optional().openapi({
      description: "Whether the bank account is enabled.",
      example: true,
    }),
    balance: z.number().optional().openapi({
      description: "Current balance of the bank account.",
      example: 1500.75,
    }),
    currency: z.string().optional().openapi({
      description: "The currency code for the bank account (ISO 4217).",
      example: "USD",
    }),
    type: z
      .enum(["depository", "credit", "other_asset", "loan", "other_liability"])
      .optional()
      .openapi({
        description: "Type of the bank account.",
        example: "depository",
      }),
  })
  .openapi({
    description: "Schema for updating a bank account.",
    example: {
      id: "b7e6c2a0-1f2d-4c3b-9a8e-123456789abc",
      name: "Checking Account",
      enabled: true,
      balance: 1500.75,
      type: "depository",
    },
  });

export const createBankAccountSchema = z
  .object({
    name: z.string().openapi({
      description: "The name of the bank account.",
      example: "Checking Account",
    }),
    currency: z.string().optional().openapi({
      description: "The currency code for the bank account (ISO 4217).",
      example: "USD",
    }),
    manual: z.boolean().optional().openapi({
      description: "Whether the bank account is a manual account.",
      example: false,
    }),
  })
  .openapi({
    description: "Schema for creating a new bank account.",
    example: {
      name: "Checking Account",
      currency: "USD",
      manual: false,
    },
  });
