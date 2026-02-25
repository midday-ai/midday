import { describe, expect, it } from "bun:test";
import {
  buildCsvMappingPrompt,
  compactSampleRows,
  normalizeColumns,
  selectPromptColumns,
} from "./csv-mapping-prompt";

describe("normalizeColumns", () => {
  it("trims, dedupes, and removes empty columns", () => {
    expect(
      normalizeColumns([
        " Date ",
        "Amount",
        "Amount",
        "",
        "   ",
        "Description",
      ]),
    ).toEqual(["Date", "Amount", "Description"]);
  });
});

describe("compactSampleRows", () => {
  it("limits sample rows and truncates large cell values", () => {
    const rows = compactSampleRows([
      { Amount: "123", Description: "Coffee" },
      { Amount: "456", Description: "Lunch" },
      { Amount: "789", Description: "Dinner" },
      { Note: "x".repeat(120) },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Amount: "123", Description: "Coffee" });
    expect(rows[1]).toEqual({ Amount: "456", Description: "Lunch" });
  });
});

describe("buildCsvMappingPrompt", () => {
  it("includes compact transaction-focused context", () => {
    const prompt = buildCsvMappingPrompt(
      [" Date ", "Amount", "Description", "Currency"],
      [{ Date: "2026-02-25", Amount: "100.50", Description: "Subscription" }],
    );

    expect(prompt).toContain(
      "Map CSV columns to: date, description, counterparty, amount, balance, currency.",
    );
    expect(prompt).toContain("<csv_columns>");
    expect(prompt).toContain("<column>Date</column>");
    expect(prompt).toContain("<sample_rows>");
    expect(prompt).toContain('"Date":"2026-02-25"');
    expect(prompt).toContain("<rules>");
    expect(prompt).toContain("Never invent column names.");
  });

  it("handles empty rows without breaking prompt", () => {
    const prompt = buildCsvMappingPrompt(["Date", "Amount"], []);

    expect(prompt).toContain("<csv_columns>");
    expect(prompt).toContain("<column>Date</column>");
    expect(prompt).toContain("<column>Amount</column>");
    expect(prompt).toContain("(none)");
  });
});

describe("selectPromptColumns", () => {
  it("keeps all normalized columns for unknown CSV formats", () => {
    const columns = selectPromptColumns([
      "id",
      "team_id",
      "internal_id",
      "date",
      "name",
      "amount",
      "currency",
      "description",
      "balance",
      "fts_vector",
    ]);

    expect(columns).toEqual([
      "id",
      "team_id",
      "internal_id",
      "date",
      "name",
      "amount",
      "currency",
      "description",
      "balance",
      "fts_vector",
    ]);
  });
});
