import type { CsvTransformedParams } from "./types";
import {
  filterTransactions,
  findIndexesByKey,
  parseCsv,
  transform,
  transformAmount,
} from "./utils";

export function csvTransformed({
  raw,
  extracted,
  teamId,
}: CsvTransformedParams) {
  const originalCsv = parseCsv(raw);
  const firstFewRows = extracted.splice(5, 20);

  const dateIndex = findIndexesByKey({
    raw: originalCsv,
    input: firstFewRows,
    key: "date",
  });

  const amountIndex = findIndexesByKey({
    raw: originalCsv,
    input: firstFewRows,
    key: "amount",
    // We need to normalize the amount value
    parse: (value) => {
      return Math.round(transformAmount(value));
    },
  });

  const descriptionIndex = findIndexesByKey({
    raw: originalCsv,
    input: firstFewRows,
    key: "description",
  });

  const mappedTransactions = originalCsv
    .map((row) => {
      const values = Object.values(row);

      return {
        date: values.at(dateIndex),
        amount: values.at(amountIndex),
        description: values.at(descriptionIndex),
        teamId,
      };
    })
    // Filter out headers etc
    .filter(filterTransactions)
    // Transform to our format
    .map(transform);

  return mappedTransactions;
}
