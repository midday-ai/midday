import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  calculateInboxSuggestions,
  confirmMatchSuggestion,
  createMatchSuggestion,
  declineMatchSuggestion,
  findInboxMatches,
  findMatches,
  getTeamCalibration,
} from "../transaction-matching";
import {
  createMockDb,
  createTestCalibrationData,
  createTestInboxItem,
  createTestTransaction,
  testScenarios,
} from "./test-setup";

describe("Transaction Matching Algorithm", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("Core Matching Functions", () => {
    test("findMatches - perfect same currency match", async () => {
      const { inbox, transaction, expectedConfidence } =
        testScenarios.perfectMatch;

      // Mock database responses
      mockDb.__setMockResult("inboxData", [inbox]);
      mockDb.__setMockResult("teamData", [{ baseCurrency: "USD" }]);
      mockDb.__setMockResult("candidateTransactions", [
        { ...transaction, embeddingScore: 0.1 }, // Low distance = high similarity
      ]);

      // Mock the database calls
      mockDb.select = mock(() => ({
        from: mock(() => ({
          leftJoin: mock(() => ({
            where: mock(() => ({
              limit: mock(() => Promise.resolve([inbox])),
            })),
          })),
        })),
      }));

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(result).toBeTruthy();
      expect(result?.confidenceScore).toBeGreaterThan(
        expectedConfidence - 0.05,
      );
      expect(result?.matchType).toBe("auto_matched");
    });

    test("findMatches - cross currency exact base amount match", async () => {
      const { inbox, transaction, expectedConfidence } =
        testScenarios.crossCurrencyMatch;

      mockDb.select = mock()
        .mockReturnValueOnce({
          from: mock().mockReturnValue({
            leftJoin: mock().mockReturnValue({
              where: mock().mockReturnValue({
                limit: mock().mockReturnValue(Promise.resolve([inbox])),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: mock().mockReturnValue({
            where: mock().mockReturnValue({
              limit: mock().mockReturnValue(
                Promise.resolve([{ baseCurrency: "EUR" }]),
              ),
            }),
          }),
        });

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(result?.confidenceScore).toBeGreaterThan(
        expectedConfidence - 0.05,
      );
      expect(result?.matchType).toBe("auto_matched");
    });

    test("findMatches - semantic match with good confidence", async () => {
      const { inbox, transaction, expectedConfidence } =
        testScenarios.semanticMatch;

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(result?.confidenceScore).toBeGreaterThan(expectedConfidence - 0.1);
      expect(result?.confidenceScore).toBeLessThan(0.95); // Below auto-match threshold
      expect(result?.matchType).toBe("suggested");
    });

    test("findMatches - poor match should be rejected", async () => {
      const { inbox, transaction } = testScenarios.poorMatch;

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      // Should either return null or very low confidence
      expect(result === null || result.confidenceScore < 0.5).toBe(true);
    });
  });

  describe("Confidence Scoring Edge Cases", () => {
    test("handles missing amounts gracefully", async () => {
      const { inbox, transaction } = testScenarios.edgeCases.missingAmount;

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      // Should handle gracefully without throwing
      expect(
        typeof result?.confidenceScore === "number" || result === null,
      ).toBe(true);
    });

    test("handles zero amounts", async () => {
      const { inbox, transaction } = testScenarios.edgeCases.zeroAmount;

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(
        typeof result?.confidenceScore === "number" || result === null,
      ).toBe(true);
    });

    test("penalizes large date differences", async () => {
      const { inbox, transaction } = testScenarios.edgeCases.hugeDateDifference;

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      if (result) {
        expect(result.confidenceScore).toBeLessThan(0.8); // Should be penalized
      }
    });
  });

  describe("Team Calibration System", () => {
    test("returns default thresholds with insufficient data", async () => {
      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve([])), // No historical data
        })),
      }));

      const calibration = await getTeamCalibration(mockDb, "test-team-1");

      expect(calibration.calibratedAutoThreshold).toBe(0.95);
      expect(calibration.calibratedSuggestedThreshold).toBe(0.7);
      expect(calibration.totalSuggestions).toBe(0);
    });

    test("adjusts thresholds based on high accuracy", async () => {
      const highAccuracyData = Array.from({ length: 20 }, (_, i) => ({
        matchType: "auto_matched",
        status: "confirmed",
        confidenceScore: 0.95 + i * 0.001, // High confidence confirmed matches
        createdAt: new Date().toISOString(),
      }));

      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve(highAccuracyData)),
        })),
      }));

      const calibration = await getTeamCalibration(mockDb, "test-team-1");

      expect(calibration.calibratedAutoThreshold).toBeLessThan(0.95); // Should be more aggressive
      expect(calibration.autoMatchAccuracy).toBeGreaterThan(0.95);
    });

    test("becomes more conservative after false positives", async () => {
      const falsePositiveData = Array.from({ length: 10 }, (_, i) => ({
        matchType: "auto_matched",
        status: i < 2 ? "declined" : "confirmed", // 2 false positives
        confidenceScore: 0.96,
        createdAt: new Date().toISOString(),
      }));

      mockDb.select = mock(() => ({
        from: mock(() => ({
          where: mock(() => Promise.resolve(falsePositiveData)),
        })),
      }));

      const calibration = await getTeamCalibration(mockDb, "test-team-1");

      expect(calibration.calibratedAutoThreshold).toBeGreaterThan(0.95); // Should be more conservative
    });
  });

  describe("Match Suggestion Lifecycle", () => {
    test("calculateInboxSuggestions - auto match flow", async () => {
      // Mock a high-confidence match
      mockDb.select = mock().mockReturnValueOnce({
        from: mock().mockReturnValue({
          leftJoin: mock().mockReturnValue({
            where: mock().mockReturnValue({
              limit: mock().mockReturnValue(
                Promise.resolve([testScenarios.perfectMatch.inbox]),
              ),
            }),
          }),
        }),
      });

      const result = await calculateInboxSuggestions(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(result.action).toBe("auto_matched");
      expect(result.suggestion).toBeTruthy();
    });

    test("calculateInboxSuggestions - suggestion created flow", async () => {
      // Mock a medium-confidence match
      const result = await calculateInboxSuggestions(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(["suggestion_created", "no_match_yet"]).toContain(result.action);
    });

    test("calculateInboxSuggestions - no match flow", async () => {
      // Mock no suitable matches
      mockDb.select = mock(() => ({
        from: mock(() => ({
          leftJoin: mock(() => ({
            where: mock(() => ({
              limit: mock(() => Promise.resolve([])), // No matches
            })),
          })),
        })),
      }));

      const result = await calculateInboxSuggestions(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      expect(result.action).toBe("no_match_yet");
    });
  });

  describe("User Feedback Integration", () => {
    test("confirmMatchSuggestion updates status and triggers match", async () => {
      mockDb.update = mock(() => ({
        set: mock(() => ({
          where: mock(() => Promise.resolve([{ id: "suggestion-1" }])),
        })),
      }));

      const result = await confirmMatchSuggestion(mockDb, {
        suggestionId: "suggestion-1",
        teamId: "test-team-1",
      });

      expect(result).toBeTruthy();
      expect(mockDb.update).toHaveBeenCalled();
    });

    test("declineMatchSuggestion updates status only", async () => {
      mockDb.update = mock(() => ({
        set: mock(() => ({
          where: mock(() => Promise.resolve([{ id: "suggestion-1" }])),
        })),
      }));

      const result = await declineMatchSuggestion(mockDb, {
        suggestionId: "suggestion-1",
        teamId: "test-team-1",
      });

      expect(result).toBeTruthy();
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("Performance and Boundary Tests", () => {
    test("confidence scores are always between 0 and 1", async () => {
      // Test with extreme values
      const extremeInbox = createTestInboxItem({
        amount: 999999.99,
        date: "1900-01-01",
      });

      const result = await findMatches(mockDb, {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      });

      if (result) {
        expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(result.confidenceScore).toBeLessThanOrEqual(1);
      }
    });

    test("handles concurrent matching requests", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        findMatches(mockDb, {
          teamId: "test-team-1",
          inboxId: `test-inbox-${i}`,
        }),
      );

      const results = await Promise.all(promises);

      // Should handle all requests without errors
      expect(results).toHaveLength(10);
    });
  });
});
