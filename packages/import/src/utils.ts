import crypto from "node:crypto";
import { capitalCase } from "change-case";
import { parse } from "csv-parse/sync";
import { formatISO } from "date-fns";
import { z } from "zod";
import type {
  ExtractedTransaction,
  FindIndexesByKeyParams,
  Transaction,
} from "./types";

function generateId(value: string) {
  const hash = crypto.createHash("sha256");
  hash.update(value);

  return hash.digest("hex");
}

type TransformTransaction = Transaction & { teamId: string };

export function transformAmount(amount: string | number) {
  return +amount
    .toString()
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");
}

export function parseAmount(amount: string | number) {
  return +amount.toString().replace(/\s/g, "").replace(",", ".");
}

export function transform(transaction: TransformTransaction) {
  const internalId = generateId(`${transaction.date}-${transaction.name}`);

  return {
    internal_id: `${transaction.teamId}_${internalId}`,
    team_id: transaction.teamId,
    status: "posted",
    method: "other",
    date: formatISO(transaction.date, { representation: "date" }),
    amount: transformAmount(transaction.amount),
    name: transaction?.description && capitalCase(transaction.description),
    manual: true,
    category: transformAmount(transaction.amount) > 0 ? "income" : null,
  };
}

function detectDelimiter(input: string) {
  const delimiters = [",", ";", "|", ".", "\t"];
  const idx = delimiters
    .map((d) => input.indexOf(d))
    .reduce((prev, cur) =>
      prev === -1 || (cur !== -1 && cur < prev) ? cur : prev,
    );

  return input[idx] || ",";
}

export function parseCsv(input: string) {
  return parse(input, {
    delimiter: detectDelimiter(input),
    skip_empty_lines: true,
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
    r.findIndex((v) => values.includes(parse(v))),
  );

  return Math.max(...matchIndices);
};
