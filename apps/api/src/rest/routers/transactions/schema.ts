import "zod-openapi/extend";
import { getTransactionsSchema } from "@api/schemas/transactions";
import z from "zod";

export const transactionsQuerySchema = getTransactionsSchema.openapi({
  ref: "Query",
});

export const transactionsResponseSchema = z.string().openapi({
  example: "Hello Steven!",
});
