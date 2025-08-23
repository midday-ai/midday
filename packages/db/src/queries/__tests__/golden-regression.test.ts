import { beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { findMatches, getTeamCalibration } from "../transaction-matching";
import {
  type GoldenMatch,
  getGoldenMatchesByType,
  goldenMatches,
  performanceBenchmarks,
} from "./golden-dataset";
import { createMockDb } from "./test-setup";

/**
 * Golden Dataset Regression Tests
 *
 * These tests ensure that changes to the matching algorithm don't break
 * known good behaviors. Any test failure here indicates a regression
 * that needs to be carefully evaluated.
 */

describe("Golden Dataset Regression Tests", () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("Known Good Matches", () => {
    const goodMatches = getGoldenMatchesByType("should_match");

    test.each(goodMatches)(
      "$id: $description",
      async (goldenMatch: GoldenMatch) => {
        // Mock the database to return our golden dataset
        mockDb.select = mock()
          // First call: get inbox data
          .mockReturnValueOnce({
            from: mock().mockReturnValue({
              leftJoin: mock().mockReturnValue({
                where: mock().mockReturnValue({
                  limit: mock().mockReturnValue(
                    Promise.resolve([goldenMatch.inboxItem]),
                  ),
                }),
              }),
            }),
          })
          // Second call: get team data
          .mockReturnValueOnce({
            from: mock().mockReturnValue({
              where: mock().mockReturnValue({
                limit: mock().mockReturnValue(
                  Promise.resolve([
                    {
                      baseCurrency: goldenMatch.inboxItem.baseCurrency || "USD",
                    },
                  ]),
                ),
              }),
            }),
          })
          // Third call: get candidate transactions
          .mockReturnValueOnce({
            from: mock().mockReturnValue({
              leftJoin: mock().mockReturnValue({
                where: mock().mockReturnValue({
                  orderBy: mock().mockReturnValue({
                    limit: mock().mockReturnValue(
                      Promise.resolve([
                        {
                          ...goldenMatch.transaction,
                          embeddingScore: 0.1, // Low distance = high similarity
                        },
                      ]),
                    ),
                  }),
                }),
              }),
            }),
          });

        const result = await findMatches(mockDb, {
          teamId: goldenMatch.inboxItem.teamId,
          inboxId: goldenMatch.inboxItem.id,
        });

        // Assertions based on golden dataset expectations
        if (goldenMatch.expected.shouldMatch) {
          expect(result).toBeTruthy();
          if (result) {
            expect(result.confidenceScore).toBeGreaterThanOrEqual(
              goldenMatch.expected.minConfidence,
            );
            expect(result.confidenceScore).toBeLessThanOrEqual(
              goldenMatch.expected.maxConfidence,
            );

            if (goldenMatch.expected.expectedMatchType) {
              expect(result.matchType).toBe(
                goldenMatch.expected.expectedMatchType,
              );
            }
          }
        } else {
          // Should either return null or very low confidence
          expect(
            result === null ||
              result.confidenceScore < goldenMatch.expected.maxConfidence,
          ).toBe(true);
        }
      },
    );
  });

  describe("Known Bad Matches", () => {
    const badMatches = getGoldenMatchesByType("should_not_match");

    test.each(badMatches)(
      "$id: $description",
      async (goldenMatch: GoldenMatch) => {
        // Mock database for bad matches
        mockDb.select = mock()
          .mockReturnValueOnce({
            from: mock().mockReturnValue({
              leftJoin: mock().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockReturnValue(Promise.resolve([goldenMatch.inboxItem])),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(
                  Promise.resolve([
                    {
                      baseCurrency: goldenMatch.inboxItem.baseCurrency || "USD",
                    },
                  ]),
                ),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue(
                      Promise.resolve([
                        {
                          ...goldenMatch.transaction,
                          embeddingScore: 0.8, // High distance = low similarity
                        },
                      ]),
                    ),
                  }),
                }),
              }),
            }),
          });

        const result = await findMatches(mockDb, {
          teamId: goldenMatch.inboxItem.teamId,
          inboxId: goldenMatch.inboxItem.id,
        });

        // Should not match or have very low confidence
        expect(
          result === null ||
            result.confidenceScore < goldenMatch.expected.maxConfidence,
        ).toBe(true);
      },
    );
  });

  describe("Edge Cases", () => {
    const edgeCases = getGoldenMatchesByType("edge_cases");

    test.each(edgeCases)(
      "$id: $description",
      async (goldenMatch: GoldenMatch) => {
        // Mock for edge cases
        mockDb.select = jest
          .fn()
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockReturnValue(Promise.resolve([goldenMatch.inboxItem])),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue(
                  Promise.resolve([
                    {
                      baseCurrency: goldenMatch.inboxItem.baseCurrency || "USD",
                    },
                  ]),
                ),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue(
                      Promise.resolve([
                        {
                          ...goldenMatch.transaction,
                          embeddingScore: 0.3, // Medium similarity
                        },
                      ]),
                    ),
                  }),
                }),
              }),
            }),
          });

        const result = await findMatches(mockDb, {
          teamId: goldenMatch.inboxItem.teamId,
          inboxId: goldenMatch.inboxItem.id,
        });

        // Edge cases should handle gracefully without throwing
        expect(() => result).not.toThrow();

        if (result) {
          expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(result.confidenceScore).toBeLessThanOrEqual(1);
          expect(result.confidenceScore).toBeGreaterThanOrEqual(
            goldenMatch.expected.minConfidence,
          );
          expect(result.confidenceScore).toBeLessThanOrEqual(
            goldenMatch.expected.maxConfidence,
          );
        }
      },
    );
  });

  describe("Performance Benchmarks", () => {
    test("single match performance", async () => {
      const goldenMatch = goldenMatches[0]; // Use first match for performance test

      // Mock database
      mockDb.select = jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockReturnValue(Promise.resolve([goldenMatch!.inboxItem])),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockReturnValue(Promise.resolve([{ baseCurrency: "USD" }])),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockReturnValue(
                      Promise.resolve([goldenMatch!.transaction]),
                    ),
                }),
              }),
            }),
          }),
        });

      const startTime = performance.now();

      await findMatches(mockDb, {
        teamId: goldenMatch!.inboxItem.teamId,
        inboxId: goldenMatch!.inboxItem.id,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(
        performanceBenchmarks.singleMatch.maxTimeMs,
      );
    });

    test("batch matching performance", async () => {
      const batchSize = performanceBenchmarks.batchMatching.batchSize;
      const testMatches = goldenMatches.slice(0, batchSize);

      const startTime = performance.now();

      const promises = testMatches.map(async (goldenMatch, index) => {
        // Mock for each call
        const localMockDb = createMockDb();
        localMockDb.select = jest
          .fn()
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockReturnValue(Promise.resolve([goldenMatch.inboxItem])),
                }),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockReturnValue(Promise.resolve([{ baseCurrency: "USD" }])),
              }),
            }),
          })
          .mockReturnValueOnce({
            from: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  orderBy: jest.fn().mockReturnValue({
                    limit: jest
                      .fn()
                      .mockReturnValue(
                        Promise.resolve([goldenMatch.transaction]),
                      ),
                  }),
                }),
              }),
            }),
          });

        // @ts-expect-error - we're mocking the database
        return findMatches(localMockDb, {
          teamId: goldenMatch!.inboxItem.teamId,
          inboxId: `${goldenMatch!.inboxItem.id}-${index}`,
        });
      });

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(
        performanceBenchmarks.batchMatching.maxTimeMs,
      );
    });
  });

  describe("Algorithm Consistency", () => {
    test("same input should always produce same output", async () => {
      const goldenMatch = goldenMatches[0];

      const mockFn = jest
        .fn()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockReturnValue(Promise.resolve([goldenMatch!.inboxItem])),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockReturnValue(Promise.resolve([{ baseCurrency: "USD" }])),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                orderBy: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockReturnValue(
                      Promise.resolve([goldenMatch!.transaction]),
                    ),
                }),
              }),
            }),
          }),
        });

      mockDb.select = mockFn;

      const result1 = await findMatches(mockDb, {
        teamId: goldenMatch!.inboxItem.teamId,
        inboxId: goldenMatch!.inboxItem.id,
      });

      // Reset mock for second call
      mockDb.select = mockFn;

      const result2 = await findMatches(mockDb, {
        teamId: goldenMatch!.inboxItem.teamId,
        inboxId: goldenMatch!.inboxItem.id,
      });

      // Results should be identical
      expect(result1!.confidenceScore).toBe(result2!.confidenceScore);
      expect(result1!.matchType).toBe(result2!.matchType);
      expect(result1!.transactionId).toBe(result2!.transactionId);
    });
  });
});
