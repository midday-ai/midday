import { describe, expect, test } from "bun:test";
import { createMockDb } from "./test-setup";

/**
 * Simple Unit Tests to verify test infrastructure
 */

describe("Test Infrastructure", () => {
  test("mock database is created successfully", () => {
    const mockDb = createMockDb();
    expect(mockDb).toBeTruthy();
  });

  test("basic math works", () => {
    expect(2 + 2).toBe(4);
  });

  test("confidence scores are in valid range", () => {
    const testScores = [0.0, 0.5, 0.95, 1.0];

    testScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  test("golden dataset structure is valid", () => {
    const { goldenMatches } = require("./golden-dataset");

    expect(goldenMatches).toBeTruthy();
    expect(Array.isArray(goldenMatches)).toBe(true);
    expect(goldenMatches.length).toBeGreaterThan(0);

    // Test first golden match structure
    const firstMatch = goldenMatches[0];
    expect(firstMatch.id).toBeTruthy();
    expect(firstMatch.description).toBeTruthy();
    expect(firstMatch.inboxItem).toBeTruthy();
    expect(firstMatch.transaction).toBeTruthy();
    expect(firstMatch.expected).toBeTruthy();
  });
});
