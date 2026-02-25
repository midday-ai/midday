import { formatDate } from "@midday/import";

import { mappableFields } from "./context";

/**
 * Returns the balance value from the row with the latest date.
 * Used for both preview and import to ensure consistency.
 */
export function getBalanceFromLatestDate(
  rows: Record<string, string>[],
  dateColumn: string,
  balanceColumn: string,
): string | undefined {
  if (
    !rows.length ||
    !dateColumn ||
    !balanceColumn ||
    balanceColumn === "None"
  ) {
    return undefined;
  }

  const rowsWithDates = rows
    .map((row) => ({
      row,
      parsed: formatDate(row[dateColumn] ?? ""),
    }))
    .filter((r): r is { row: Record<string, string>; parsed: string } =>
      Boolean(r.parsed),
    );

  if (rowsWithDates.length === 0) return undefined;

  const latest = rowsWithDates.sort((a, b) =>
    b.parsed.localeCompare(a.parsed),
  )[0];

  return latest?.row[balanceColumn]?.trim() || undefined;
}

export function isActiveRequest(
  requestId: number,
  activeRequestRef: { current: number },
) {
  return requestId === activeRequestRef.current;
}

export function shouldApplyMappedColumn(
  field: string,
  value: unknown,
  fileColumns: string[],
): field is keyof typeof mappableFields {
  return (
    Object.keys(mappableFields).includes(field) &&
    typeof value === "string" &&
    fileColumns.includes(value)
  );
}
