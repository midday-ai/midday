const TARGET_FIELDS = [
  "date",
  "description",
  "counterparty",
  "amount",
  "balance",
  "currency",
];
const MAX_SAMPLE_ROWS = 2;
const MAX_CELL_LENGTH = 80;

function clampCellValue(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.length > MAX_CELL_LENGTH
    ? `${trimmed.slice(0, MAX_CELL_LENGTH)}...`
    : trimmed;
}

export function normalizeColumns(fieldColumns: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const column of fieldColumns) {
    const trimmed = column.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

export function selectPromptColumns(fieldColumns: string[]): string[] {
  // Keep all discovered columns to avoid dropping unknown-but-important fields.
  return normalizeColumns(fieldColumns);
}

export function compactSampleRows(
  firstRows: Record<string, string>[],
  allowedColumns?: string[],
) {
  const allowedSet = allowedColumns ? new Set(allowedColumns) : null;

  return firstRows.slice(0, MAX_SAMPLE_ROWS).map((row) => {
    const compactRow: Record<string, string> = {};

    for (const [key, value] of Object.entries(row)) {
      const safeKey = key.trim();
      const safeValue = clampCellValue(value);

      if (safeKey && safeValue && (!allowedSet || allowedSet.has(safeKey))) {
        compactRow[safeKey] = safeValue;
      }
    }

    return compactRow;
  });
}

export function buildCsvMappingPrompt(
  fieldColumns: string[],
  firstRows: Record<string, string>[],
): string {
  const columns = selectPromptColumns(fieldColumns);
  const sampleRows = compactSampleRows(firstRows, columns);
  const columnList = columns
    .map((column) => `<column>${column}</column>`)
    .join("\n");
  const sampleRowList =
    sampleRows.map((row) => JSON.stringify(row)).join("\n") || "(none)";

  return [
    "<role>",
    "You map transaction CSV columns to a fixed output schema.",
    "</role>",
    "",
    "<task>",
    `Map CSV columns to: ${TARGET_FIELDS.join(", ")}.`,
    "</task>",
    "",
    "<rules>",
    "1) Return only exact CSV column names for mapped fields.",
    "2) If no matching column exists, omit that field.",
    "3) Never invent column names.",
    "4) For currency, return a column name when one exists; otherwise return an inferred 3-letter ISO code.",
    "5) description = transaction text/memo/merchant details. This is used as the transaction name.",
    "6) counterparty = the other party in the transaction: merchant, vendor, payee, payer, recipient, or from/to. Use Merchant, Vendor, Payee, Payer, Recipient, From/To, Beneficiary, etc. NEVER use Cardholder, Account Holder, Name, Customer, or similar columns that identify the account owner—those are the user, not the counterparty.",
    "7) Do not map both description and counterparty to the same column. Each field must use a different column. If only one column fits both (e.g. Merchant), map it to description and omit counterparty.",
    "</rules>",
    "",
    "<examples>",
    "<example>",
    "<columns>['Date','Text','Amount','Currency']</columns>",
    '<result>{"date":"Date","description":"Text","amount":"Amount","currency":"Currency"}</result>',
    "</example>",
    "<example>",
    "<columns>['Booking Date','From/To','Amount']</columns>",
    '<result>{"date":"Booking Date","counterparty":"From/To","amount":"Amount"}</result>',
    "</example>",
    "<example>",
    "<columns>['Payment Date','Merchant','Cardholder','Transaction Amount']</columns>",
    '<result>{"date":"Payment Date","description":"Merchant","amount":"Transaction Amount"}</result>',
    "</example>",
    "</examples>",
    "",
    "<csv_columns>",
    columnList,
    "</csv_columns>",
    "",
    "<sample_rows>",
    sampleRowList,
    "</sample_rows>",
    "",
    "<output_contract>",
    "Return only schema fields in object form. No prose.",
    "</output_contract>",
  ].join("\n");
}
