import {
  createBankAccount,
  deleteBankAccount,
  getBankAccountById,
  getBankAccounts,
  updateBankAccount,
} from "@api/db/queries/bank-accounts";
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
import { requestBodyResolver } from "@api/utils/request-body-resolver";
import { withSanitized } from "@api/utils/with-sanitized";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver } from "hono-openapi/zod";

const app = new Hono<Context>();

app.get(
  "/",
  describeRoute({
    description: "Get bank accounts",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "List of bank accounts",
        content: {
          "application/json": {
            schema: resolver(bankAccountsResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("query", getBankAccountsSchema),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("query");

    const data = await getBankAccounts(db, {
      teamId,
      ...params,
    });

    return c.json({ data });
  },
);

app.post(
  "/",
  describeRoute({
    description: "Create bank account",
    tags: ["Bank Accounts"],
    requestBody: {
      content: {
        "application/json": {
          schema: requestBodyResolver(createBankAccountSchema),
        },
      },
    },
    responses: {
      201: {
        description: "Bank account created",
        content: {
          "application/json": {
            schema: resolver(bankAccountResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("json", createBankAccountSchema),
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

    return c.json(result);
  },
);

app.get(
  "/:id",
  describeRoute({
    description: "Get bank account by ID",
    tags: ["Bank Accounts"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: resolver(getBankAccountByIdSchema),
      },
    ],
    responses: {
      200: {
        description: "Bank account details",
        content: {
          "application/json": {
            schema: resolver(bankAccountResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("param", getBankAccountByIdSchema),
  async (c) => {
    const db = c.get("db");
    const id = c.req.valid("param").id;
    const teamId = c.get("teamId");

    const result = await getBankAccountById(db, {
      id,
      teamId,
    });

    return c.json(withSanitized(bankAccountResponseSchema, result));
  },
);

app.put(
  "/:id",
  describeRoute({
    description: "Update bank account by ID",
    tags: ["Bank Accounts"],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: resolver(deleteBankAccountSchema),
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: requestBodyResolver(updateBankAccountSchema),
        },
      },
    },
    responses: {
      200: {
        description: "Bank account updated",
        content: {
          "application/json": {
            schema: resolver(bankAccountResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("param", deleteBankAccountSchema),
  zValidator("json", updateBankAccountSchema),
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

    return c.json(withSanitized(bankAccountResponseSchema, result));
  },
);

app.delete(
  "/:id",
  describeRoute({
    description: "Delete bank account by ID",
    tags: ["Bank Accounts"],
    responses: {
      200: {
        description: "Bank account deleted",
        content: {
          "application/json": {
            schema: resolver(bankAccountResponseSchema),
          },
        },
      },
    },
  }),
  zValidator("param", deleteBankAccountSchema),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const id = c.req.valid("param").id;

    const result = await deleteBankAccount(db, {
      id,
      teamId,
    });

    return c.json(withSanitized(bankAccountResponseSchema, result));
  },
);

export const bankAccountsRouter = app;
