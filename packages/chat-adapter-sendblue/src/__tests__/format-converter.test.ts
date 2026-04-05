import { describe, expect, test } from "bun:test";
import { toPlainText } from "../format-converter";

describe("toPlainText", () => {
  test("strips bold", () => {
    expect(toPlainText("This is **bold** text")).toBe("This is bold text");
  });

  test("strips italic with asterisks", () => {
    expect(toPlainText("This is *italic* text")).toBe("This is italic text");
  });

  test("strips italic with underscores", () => {
    expect(toPlainText("This is _italic_ text")).toBe("This is italic text");
  });

  test("strips bold+italic", () => {
    expect(toPlainText("This is ***bold italic*** text")).toBe(
      "This is bold italic text",
    );
  });

  test("strips strikethrough", () => {
    expect(toPlainText("This is ~~deleted~~ text")).toBe(
      "This is deleted text",
    );
  });

  test("strips inline code", () => {
    expect(toPlainText("Run `npm install` now")).toBe("Run npm install now");
  });

  test("strips code fences", () => {
    const input = "Before\n```typescript\nconst x = 1;\n```\nAfter";
    expect(toPlainText(input)).toBe("Before\nconst x = 1;\nAfter");
  });

  test("converts markdown links to text (url)", () => {
    expect(toPlainText("Visit [Midday](https://midday.ai) today")).toBe(
      "Visit Midday (https://midday.ai) today",
    );
  });

  test("strips heading markers", () => {
    expect(toPlainText("## Invoice Details")).toBe("Invoice Details");
    expect(toPlainText("# Title")).toBe("Title");
    expect(toPlainText("### Sub-heading")).toBe("Sub-heading");
  });

  test("converts unordered list markers to bullets", () => {
    const input = "- Item one\n- Item two\n- Item three";
    expect(toPlainText(input)).toBe("• Item one\n• Item two\n• Item three");
  });

  test("strips horizontal rules", () => {
    expect(toPlainText("Above\n---\nBelow")).toBe("Above\n\nBelow");
  });

  test("preserves URLs with underscores intact", () => {
    const url =
      "https://app.midday.ai/i/eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjRhMDhkM2QzLTIzZDUtNDVmZS04ZjdjLTkyNjYxM2NlNjg5ZCJ9.Qkc_SlJJKWr5c5eYn3wcG4_T_wlDr6ceAEQlWCYV9Kg";
    expect(toPlainText(url)).toBe(url);
  });

  test("preserves URLs inside markdown links", () => {
    const input =
      "[Preview](https://app.midday.ai/i/eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI4ZTM3OGNhIn0.E6PZ)";
    expect(toPlainText(input)).toBe(
      "Preview (https://app.midday.ai/i/eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI4ZTM3OGNhIn0.E6PZ)",
    );
  });

  test("preserves newlines", () => {
    expect(toPlainText("Line one\n\nLine two")).toBe("Line one\n\nLine two");
  });

  test("handles empty string", () => {
    expect(toPlainText("")).toBe("");
  });

  test("handles whitespace-only string", () => {
    expect(toPlainText("   ")).toBe("");
  });
});
