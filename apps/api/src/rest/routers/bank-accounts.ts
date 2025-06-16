import type { Context } from "@api/rest/types";
import {
  bankAccountResponseSchema,
  bankAccountsResponseSchema,
  createBankAccountSchema,
  deleteBankAccountSchema,
  getBankAccountByIdSchema,
  getBankAccountsSchema,
  updateBankAccountSchema,
} from "@api/schemas/bank-accounts";
import { validateResponse } from "@api/utils/validate-response";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountById,
  getBankAccounts,
  updateBankAccount,
} from "@midday/db/queries";
import { withRequiredScope } from "../middleware";

const app = new OpenAPIHono<Context>();

app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all bank accounts",
    operationId: "listBankAccounts",
    "x-speakeasy-name-override": "list",
    description: "Retrieve a list of bank accounts for the authenticated team.",
    tags: ["Bank Accounts"],
    request: {
      query: getBankAccountsSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: bankAccountsResponseSchema,
          },
        },
        description: "Retrieve a list of bank accounts",
      },
    },
    middleware: [withRequiredScope("bank-accounts.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("query");

    const data = await getBankAccounts(db, {
      teamId,
      ...params,
    });

    return c.json(
      validateResponse(
        {
          data,
        },
        bankAccountsResponseSchema,
      ),
    );
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/{id}",
    summary: "Retrieve a bank account",
    operationId: "getBankAccountById",
    "x-speakeasy-name-override": "get",
    description: "Retrieve a bank account by ID for the authenticated team.",
    tags: ["Bank Accounts"],
    request: {
      params: getBankAccountByIdSchema,
    },
    responses: {
      200: {
        description: "Bank account details",
        content: {
          "application/json": {
            schema: bankAccountResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("bank-accounts.read")],
  }),
  async (c) => {
    const db = c.get("db");
    const id = c.req.valid("param").id;
    const teamId = c.get("teamId");

    const result = await getBankAccountById(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, bankAccountResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/",
    summary: "Create a bank account",
    operationId: "createBankAccount",
    "x-speakeasy-name-override": "create",
    description: "Create a new bank account for the authenticated team.",
    tags: ["Bank Accounts"],
    request: {
      body: {
        content: {
          "application/json": {
            schema: createBankAccountSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Bank account created",
        content: {
          "application/json": {
            schema: bankAccountResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("bank-accounts.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const session = c.get("session");
    const body = c.req.valid("json");

    const result = await createBankAccount(db, {
      ...body,
      teamId,
      userId: session.user.id,
    });

    return c.json(validateResponse(result, bankAccountResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "patch",
    path: "/{id}",
    summary: "Update a bank account",
    operationId: "updateBankAccount",
    "x-speakeasy-name-override": "update",
    description: "Update a bank account by ID for the authenticated team.",
    tags: ["Bank Accounts"],
    request: {
      params: deleteBankAccountSchema,
      body: {
        content: {
          "application/json": {
            schema: updateBankAccountSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Bank account updated",
        content: {
          "application/json": {
            schema: bankAccountResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("bank-accounts.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const body = c.req.valid("json");
    const id = c.req.valid("param").id;

    const result = await updateBankAccount(db, {
      ...body,
      id,
      teamId,
    });

    return c.json(validateResponse(result, bankAccountResponseSchema));
  },
);

app.openapi(
  createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete a bank account",
    operationId: "deleteBankAccount",
    "x-speakeasy-name-override": "delete",
    description: "Delete a bank account by ID for the authenticated team.",
    tags: ["Bank Accounts"],
    request: {
      params: deleteBankAccountSchema,
    },
    responses: {
      200: {
        description: "Bank account deleted",
        content: {
          "application/json": {
            schema: bankAccountResponseSchema,
          },
        },
      },
    },
    middleware: [withRequiredScope("bank-accounts.write")],
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await deleteBankAccount(db, {
      id,
      teamId,
    });

    return c.json(validateResponse(result, bankAccountResponseSchema));
  },
);

export const bankAccountsRouter = app;
