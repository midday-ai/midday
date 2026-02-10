import { describe, expect, test } from "bun:test";

/**
 * Transaction categorization logic tests
 *
 * These tests document the expected behavior of transaction categorization
 * in the ExportTransactionsProcessor.
 *
 * Categorization rules:
 * 1. No sync record OR failed status -> toExport (needs full export)
 * 2. Synced with new attachments -> toSyncAttachments (only sync new attachments)
 * 3. Synced with removed attachments -> toSyncAttachments (sync removals)
 * 4. Synced with "partial" status -> toSyncAttachments (retry failed)
 * 5. Synced with no changes -> alreadyComplete (skip)
 */

// Helper function that mirrors the categorization logic
function categorizeTransactions(
  transactions: Array<{
    id: string;
    attachments: Array<{ id: string; name: string | null }>;
  }>,
  syncRecordMap: Map<
    string,
    {
      status: "pending" | "synced" | "failed" | "partial";
      providerTransactionId: string | null;
      syncedAttachmentMapping: Record<string, string | null> | null;
    }
  >,
) {
  const result = {
    toExport: [] as string[],
    toSyncAttachments: [] as Array<{
      transactionId: string;
      providerTransactionId: string;
      newAttachmentIds: string[];
      removedAttachments: Array<{
        middayId: string;
        providerId: string | null;
      }>;
    }>,
    alreadyComplete: [] as string[],
  };

  for (const tx of transactions) {
    const syncRecord = syncRecordMap.get(tx.id);

    // No sync record or failed status = needs export
    if (!syncRecord || syncRecord.status === "failed") {
      result.toExport.push(tx.id);
      continue;
    }

    // Already synced - check for attachment changes
    const currentAttachmentIds = new Set(
      tx.attachments?.filter((a) => a.name !== null).map((a) => a.id) ?? [],
    );
    const syncedMapping = syncRecord.syncedAttachmentMapping ?? {};
    const syncedIds = new Set(Object.keys(syncedMapping));

    // Find new attachments (in current, not in synced)
    const newAttachmentIds = [...currentAttachmentIds].filter(
      (id) => !syncedIds.has(id),
    );

    // Find removed attachments (in synced, not in current)
    const removedAttachments = [...syncedIds]
      .filter((id) => !currentAttachmentIds.has(id))
      .map((middayId) => ({
        middayId,
        providerId: syncedMapping[middayId] ?? null,
      }));

    // Has attachment changes OR status is "partial" (needs retry)?
    const needsAttachmentSync =
      newAttachmentIds.length > 0 ||
      removedAttachments.length > 0 ||
      syncRecord.status === "partial";

    if (needsAttachmentSync) {
      if (syncRecord.providerTransactionId) {
        result.toSyncAttachments.push({
          transactionId: tx.id,
          providerTransactionId: syncRecord.providerTransactionId,
          newAttachmentIds,
          removedAttachments,
        });
      } else {
        // Has changes but no provider transaction ID - needs re-export
        result.toExport.push(tx.id);
      }
    } else {
      // No changes - skip
      result.alreadyComplete.push(tx.id);
    }
  }

  return result;
}

describe("categorizeTransactions", () => {
  describe("toExport categorization", () => {
    test("puts new transactions (no sync record) in toExport", () => {
      const transactions = [
        { id: "tx-new", attachments: [{ id: "att-1", name: "receipt.pdf" }] },
      ];
      const syncRecordMap = new Map();

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toExport).toContain("tx-new");
      expect(result.toSyncAttachments.length).toBe(0);
      expect(result.alreadyComplete.length).toBe(0);
    });

    test("puts failed transactions in toExport for retry", () => {
      const transactions = [
        {
          id: "tx-failed",
          attachments: [{ id: "att-1", name: "receipt.pdf" }],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-failed",
          {
            status: "failed" as const,
            providerTransactionId: null,
            syncedAttachmentMapping: null,
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toExport).toContain("tx-failed");
    });

    test("puts pending transactions with no provider ID in toExport", () => {
      const transactions = [
        {
          id: "tx-pending",
          attachments: [{ id: "att-1", name: "receipt.pdf" }],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-pending",
          {
            status: "synced" as const,
            providerTransactionId: null, // No provider ID
            syncedAttachmentMapping: null,
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      // Has new attachment but no provider ID = needs export
      expect(result.toExport).toContain("tx-pending");
    });
  });

  describe("toSyncAttachments categorization", () => {
    test("puts synced transactions with new attachments in toSyncAttachments", () => {
      const transactions = [
        {
          id: "tx-synced",
          attachments: [
            { id: "att-existing", name: "existing.pdf" },
            { id: "att-new", name: "new.pdf" },
          ],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-synced",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: { "att-existing": "provider-att-1" },
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toSyncAttachments.length).toBe(1);
      expect(result.toSyncAttachments[0]?.transactionId).toBe("tx-synced");
      expect(result.toSyncAttachments[0]?.newAttachmentIds).toContain(
        "att-new",
      );
    });

    test("puts synced transactions with removed attachments in toSyncAttachments", () => {
      const transactions = [
        {
          id: "tx-removed",
          attachments: [], // Attachment removed
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-removed",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: { "att-deleted": "provider-att-1" },
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toSyncAttachments.length).toBe(1);
      expect(result.toSyncAttachments[0]?.removedAttachments).toContainEqual({
        middayId: "att-deleted",
        providerId: "provider-att-1",
      });
    });

    test("puts partial status transactions in toSyncAttachments for retry", () => {
      const transactions = [
        {
          id: "tx-partial",
          attachments: [{ id: "att-1", name: "receipt.pdf" }],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-partial",
          {
            status: "partial" as const, // Previous upload failed
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: {},
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toSyncAttachments.length).toBe(1);
      expect(result.toSyncAttachments[0]?.transactionId).toBe("tx-partial");
    });
  });

  describe("alreadyComplete categorization", () => {
    test("puts fully synced transactions in alreadyComplete", () => {
      const transactions = [
        {
          id: "tx-complete",
          attachments: [{ id: "att-1", name: "receipt.pdf" }],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-complete",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: { "att-1": "provider-att-1" },
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.alreadyComplete).toContain("tx-complete");
      expect(result.toExport.length).toBe(0);
      expect(result.toSyncAttachments.length).toBe(0);
    });

    test("puts synced transactions with no attachments in alreadyComplete", () => {
      const transactions = [{ id: "tx-no-att", attachments: [] }];
      const syncRecordMap = new Map([
        [
          "tx-no-att",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: {},
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.alreadyComplete).toContain("tx-no-att");
    });
  });

  describe("edge cases", () => {
    test("ignores attachments with null names", () => {
      const transactions = [
        {
          id: "tx-null-name",
          attachments: [
            { id: "att-1", name: "valid.pdf" },
            { id: "att-2", name: null }, // Should be ignored
          ],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-null-name",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: { "att-1": "provider-att-1" },
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      // att-2 has null name, should be ignored, so no changes
      expect(result.alreadyComplete).toContain("tx-null-name");
    });

    test("handles empty syncedAttachmentMapping", () => {
      const transactions = [
        {
          id: "tx-empty-map",
          attachments: [{ id: "att-new", name: "new.pdf" }],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-empty-map",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: {}, // Empty mapping
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toSyncAttachments.length).toBe(1);
      expect(result.toSyncAttachments[0]?.newAttachmentIds).toContain(
        "att-new",
      );
    });

    test("handles null syncedAttachmentMapping", () => {
      const transactions = [
        {
          id: "tx-null-map",
          attachments: [{ id: "att-new", name: "new.pdf" }],
        },
      ];
      const syncRecordMap = new Map([
        [
          "tx-null-map",
          {
            status: "synced" as const,
            providerTransactionId: "provider-123",
            syncedAttachmentMapping: null, // Null mapping
          },
        ],
      ]);

      const result = categorizeTransactions(transactions, syncRecordMap);

      expect(result.toSyncAttachments.length).toBe(1);
      expect(result.toSyncAttachments[0]?.newAttachmentIds).toContain(
        "att-new",
      );
    });
  });
});

describe("status update logic", () => {
  // These tests document the expected behavior of status updates
  // in the SyncAttachmentsProcessor

  function determineStatus(_uploadedCount: number, failedCount: number) {
    if (failedCount > 0) {
      return "partial";
    }
    return "synced";
  }

  function determineErrorFields(
    failedCount: number,
    errorCodes: (string | null)[],
    errorMessages: string[],
  ) {
    if (failedCount > 0) {
      return {
        errorCode: errorCodes[0] ?? null,
        errorMessage:
          errorMessages[0] ?? `${failedCount} attachment(s) failed to upload`,
      };
    }
    // Explicitly clear on success
    return {
      errorCode: null,
      errorMessage: null,
    };
  }

  test("sets status to partial when failures occur", () => {
    const status = determineStatus(2, 1); // 2 succeeded, 1 failed
    expect(status).toBe("partial");
  });

  test("sets status to synced when all succeed", () => {
    const status = determineStatus(3, 0); // All succeeded
    expect(status).toBe("synced");
  });

  test("clears errorCode on successful retry", () => {
    const { errorCode } = determineErrorFields(0, [], []);
    expect(errorCode).toBe(null); // Explicitly null to clear DB field
  });

  test("clears errorMessage on successful retry", () => {
    const { errorMessage } = determineErrorFields(0, [], []);
    expect(errorMessage).toBe(null); // Explicitly null to clear DB field
  });

  test("preserves first error code when multiple failures", () => {
    const { errorCode } = determineErrorFields(
      2,
      ["RATE_LIMIT", "VALIDATION"],
      ["Rate limit exceeded", "Invalid file type"],
    );
    expect(errorCode).toBe("RATE_LIMIT"); // First error
  });

  test("preserves first error message when multiple failures", () => {
    const { errorMessage } = determineErrorFields(
      2,
      ["RATE_LIMIT", "VALIDATION"],
      ["Rate limit exceeded", "Invalid file type"],
    );
    expect(errorMessage).toBe("Rate limit exceeded"); // First error
  });

  test("uses fallback message when no specific error message", () => {
    const { errorMessage } = determineErrorFields(
      3,
      [null],
      [], // No specific messages
    );
    expect(errorMessage).toBe("3 attachment(s) failed to upload");
  });
});
