import crypto from "node:crypto";
import type { Transaction } from "@midday/providers/src/types";
import { capitalCase } from "change-case";
import { parse } from "csv-parse/sync";
import { formatISO } from "date-fns";
import { z } from "zod";
import type { ExtractedTransaction, FindIndexesByKeyParams } from "./types";

function generateId(value: string) {
  const hash = crypto.createHash("sha256");
  hash.update(value);

  return hash.digest("hex");
}

type TransformTransaction = Transaction & { teamId: string };

export function transformAmount(amount: string | number) {
  if (typeof amount === "string") {
    return +amount.replace(/\s/g, "").replace(",", ".");
  }

  return amount;
}

export function transform(transaction: TransformTransaction) {
  const internalId = generateId(
    `${transaction.date}-${transaction.name}-${transaction.amount}`
  );
  return {
    internal_id: internalId,
    team_id: transaction.teamId,
    status: "posted",
    date: formatISO(transaction.date, { representation: "date" }),
    amount: transformAmount(transaction.amount),
    name: transaction?.description && capitalCase(transaction.description),
    manual: true,
  };
}

export function parseCsv(input: string) {
  return parse(input, {
    delimiter: [",", ";", "."],
    skip_empty_lines: true,
    skip_records_with_empty_values: true,
    skip_records_with_error: true,
    trim: true,
    relax_column_count: true,
  });
}

export const transactionSchema = z.object({
  amount: z.string(),
  description: z.string(),
  date: z.coerce.date(),
});

export const filterTransactions = (row: ExtractedTransaction) => {
  const parsed = transactionSchema.safeParse(row);

  if (parsed.success) {
    return true;
  }

  return false;
};

export const findIndexesByKey = ({
  raw,
  input,
  key,
  parse = (value) => value.toString().trim(),
}: FindIndexesByKeyParams) => {
  const values = input.map((v) => parse(v[key]));

  const matchIndices = raw.map((r) =>
    r.findIndex((v) => values.includes(parse(v)))
  );

  return Math.max(...matchIndices);
};
