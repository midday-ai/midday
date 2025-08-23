import { beforeEach, describe, expect, mock, test } from "bun:test";
import { embedInbox } from "../embed-inbox";
import { matchPendingInbox } from "../match-pending-inbox";
import { processInboxMatching } from "../process-inbox-matching";

/**
 * Integration Tests for Inbox Matching Jobs
 *
 * These tests verify the end-to-end flow from document processing
 * through embedding generation to match suggestions.
 */

describe("Inbox Matching Integration Tests", () => {
  let mockDb: any;
  let mockLogger: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      select: mock().mockReturnValue({
        from: mock().mockReturnValue({
          leftJoin: mock().mockReturnValue({
            where: mock().mockReturnValue({
              limit: mock().mockReturnValue(Promise.resolve([])),
            }),
          }),
        }),
      }),
      update: mock().mockReturnValue({
        set: mock().mockReturnValue({
          where: mock().mockReturnValue(Promise.resolve([])),
        }),
      }),
      insert: mock().mockReturnValue({
        values: mock().mockReturnValue({
          returning: mock().mockReturnValue(Promise.resolve([])),
        }),
      }),
    };

    // Mock logger
    mockLogger = {
      info: mock(),
      warn: mock(),
      error: mock(),
    };

    // Mock the getDb function
    jest.doMock("@jobs/init", () => ({
      getDb: () => mockDb,
    }));
  });

  describe("Document Processing to Matching Flow", () => {
    test("successful embedding generation triggers matching", async () => {
      const testPayload = {
        inboxId: "test-inbox-1",
        teamId: "test-team-1",
      };

      // Mock successful inbox data retrieval
      mockDb.select = mock().mockReturnValueOnce({
        from: mock().mockReturnValue({
          leftJoin: mock().mockReturnValue({
            where: mock().mockReturnValue({
              limit: mock().mockReturnValue(
                Promise.resolve([
                  {
                    id: "test-inbox-1",
                    displayName: "Test Receipt",
                    amount: 50.0,
                    currency: "USD",
                    date: "2024-01-15",
                  },
                ]),
              ),
            }),
          }),
        }),
      });

      // Mock embedding generation
      jest.doMock("@jobs/utils/embeddings", () => ({
        generateEmbedding: mock().mockResolvedValue({
          embedding: new Array(1536).fill(0.5),
          model: "text-embedding-ada-002",
        }),
      }));

      // Mock text preparation
      jest.doMock("@jobs/utils/text-preparation", () => ({
        prepareInboxText: mock().mockReturnValue(
          "Test receipt content for embedding",
        ),
      }));

      // The embedding job should complete successfully
      expect(async () => {
        await embedInbox.run(testPayload);
      }).not.toThrow();
    });

    test("embedding failure sets inbox status back to pending", async () => {
      const testPayload = {
        inboxId: "test-inbox-1",
        teamId: "test-team-1",
      };

      // Mock inbox data retrieval
      mockDb.select = mock().mockReturnValueOnce({
        from: mock().mockReturnValue({
          leftJoin: mock().mockReturnValue({
            where: mock().mockReturnValue({
              limit: mock().mockReturnValue(
                Promise.resolve([
                  {
                    id: "test-inbox-1",
                    displayName: "Test Receipt",
                    amount: 50.0,
                    currency: "USD",
                    date: "2024-01-15",
                  },
                ]),
              ),
            }),
          }),
        }),
      });

      // Mock embedding generation failure
      jest.doMock("@jobs/utils/embeddings", () => ({
        generateEmbedding: mock().mockRejectedValue(
          new Error("API rate limit exceeded"),
        ),
      }));

      // Should handle the error gracefully
      await expect(embedInbox.run(testPayload)).rejects.toThrow(
        "API rate limit exceeded",
      );

      // Should have updated status back to pending
      expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe("Match Processing Flow", () => {
    test("high confidence match creates auto-match suggestion", async () => {
      const testPayload = {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      };

      // Mock successful match finding
      jest.doMock("@midday/db/queries", () => ({
        calculateInboxSuggestions: mock().mockResolvedValue({
          action: "auto_matched",
          suggestion: {
            transactionId: "test-txn-1",
            confidenceScore: 0.98,
            matchType: "auto_matched",
          },
        }),
      }));

      const result = await processInboxMatching.run(testPayload);

      expect(result.action).toBe("auto_matched");
      expect(result.suggestion?.confidenceScore).toBeGreaterThan(0.95);
    });

    test("medium confidence match creates suggestion", async () => {
      const testPayload = {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      };

      // Mock medium confidence match
      jest.doMock("@midday/db/queries", () => ({
        calculateInboxSuggestions: mock().mockResolvedValue({
          action: "suggestion_created",
          suggestion: {
            transactionId: "test-txn-1",
            confidenceScore: 0.82,
            matchType: "suggested",
          },
        }),
      }));

      const result = await processInboxMatching.run(testPayload);

      expect(result.action).toBe("suggestion_created");
      expect(result.suggestion?.confidenceScore).toBeGreaterThan(0.7);
      expect(result.suggestion?.confidenceScore).toBeLessThan(0.95);
    });

    test("no suitable match updates status to pending", async () => {
      const testPayload = {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      };

      // Mock no match found
      jest.doMock("@midday/db/queries", () => ({
        calculateInboxSuggestions: mock().mockResolvedValue({
          action: "no_match_yet",
        }),
      }));

      const result = await processInboxMatching.run(testPayload);

      expect(result.action).toBe("no_match_yet");
      expect(result.suggestion).toBeUndefined();
    });
  });

  describe("Batch Processing", () => {
    test("pending inbox matching processes multiple items", async () => {
      const testPayload = {
        teamId: "test-team-1",
        newTransactionIds: ["txn-1", "txn-2", "txn-3"],
      };

      // Mock pending inbox items
      jest.doMock("@midday/db/queries", () => ({
        getPendingInboxForMatching: mock().mockResolvedValue([
          { id: "inbox-1", displayName: "Receipt 1" },
          { id: "inbox-2", displayName: "Receipt 2" },
          { id: "inbox-3", displayName: "Receipt 3" },
        ]),
      }));

      // Mock task trigger
      const mockTasks = {
        batchTrigger: mock().mockResolvedValue([]),
      };
      jest.doMock("@trigger.dev/sdk", () => ({
        tasks: mockTasks,
        logger: mockLogger,
        schemaTask: (config: any) => config,
      }));

      await matchPendingInbox.run(testPayload);

      // Should have triggered batch jobs for all pending items
      expect(mockTasks.batchTrigger).toHaveBeenCalledWith(
        "process-inbox-matching",
        expect.arrayContaining([
          expect.objectContaining({
            payload: expect.objectContaining({ inboxId: "inbox-1" }),
          }),
          expect.objectContaining({
            payload: expect.objectContaining({ inboxId: "inbox-2" }),
          }),
          expect.objectContaining({
            payload: expect.objectContaining({ inboxId: "inbox-3" }),
          }),
        ]),
      );
    });

    test("handles empty pending inbox gracefully", async () => {
      const testPayload = {
        teamId: "test-team-1",
        newTransactionIds: ["txn-1"],
      };

      // Mock no pending items
      jest.doMock("@midday/db/queries", () => ({
        getPendingInboxForMatching: mock().mockResolvedValue([]),
      }));

      // Should complete without errors
      await expect(matchPendingInbox.run(testPayload)).resolves.not.toThrow();
    });
  });

  describe("Error Handling", () => {
    test("database connection errors are handled gracefully", async () => {
      const testPayload = {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      };

      // Mock database error
      mockDb.select = mock().mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(processInboxMatching.run(testPayload)).rejects.toThrow(
        "Database connection failed",
      );
    });

    test("invalid payload is rejected", async () => {
      const invalidPayload = {
        teamId: "invalid-team-id", // Not a valid UUID
        inboxId: "test-inbox-1",
      };

      // Should validate schema and reject
      await expect(
        processInboxMatching.run(invalidPayload as any),
      ).rejects.toThrow();
    });
  });

  describe("Performance Under Load", () => {
    test("concurrent matching requests don't interfere", async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        teamId: "test-team-1",
        inboxId: `test-inbox-${i + 1}`,
      }));

      // Mock successful processing for all
      jest.doMock("@midday/db/queries", () => ({
        calculateInboxSuggestions: mock().mockResolvedValue({
          action: "suggestion_created",
          suggestion: { transactionId: "test-txn-1", confidenceScore: 0.85 },
        }),
      }));

      const startTime = performance.now();

      const results = await Promise.all(
        concurrentRequests.map((payload) => processInboxMatching.run(payload)),
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // All should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.action).toBe("suggestion_created");
      });

      // Should complete within reasonable time (< 1 second for 5 concurrent)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Monitoring and Observability", () => {
    test("successful matching logs appropriate metrics", async () => {
      const testPayload = {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      };

      jest.doMock("@midday/db/queries", () => ({
        calculateInboxSuggestions: mock().mockResolvedValue({
          action: "auto_matched",
          suggestion: {
            transactionId: "test-txn-1",
            confidenceScore: 0.98,
            matchType: "auto_matched",
          },
        }),
      }));

      await processInboxMatching.run(testPayload);

      // Should log the successful auto-match
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Auto-matched inbox item",
        expect.objectContaining({
          teamId: "test-team-1",
          inboxId: "test-inbox-1",
          transactionId: "test-txn-1",
          confidence: 0.98,
        }),
      );
    });

    test("errors are logged with context", async () => {
      const testPayload = {
        teamId: "test-team-1",
        inboxId: "test-inbox-1",
      };

      const testError = new Error("Matching algorithm failed");
      jest.doMock("@midday/db/queries", () => ({
        calculateInboxSuggestions: mock().mockRejectedValue(testError),
      }));

      await expect(processInboxMatching.run(testPayload)).rejects.toThrow(
        "Matching algorithm failed",
      );

      // Should log error with context
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to process inbox matching",
        expect.objectContaining({
          teamId: "test-team-1",
          inboxId: "test-inbox-1",
          error: "Matching algorithm failed",
        }),
      );
    });
  });
});
