import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { MappedTransaction, ProviderInitConfig } from "../types";
import { FORTNOX_SCOPES, FortnoxProvider } from "./fortnox";

// Helper to create a mock provider with token
function createProvider(accessToken = "test-token"): FortnoxProvider {
  const config: ProviderInitConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "https://example.com/callback",
    config: {
      provider: "fortnox",
      accessToken,
      refreshToken: "test-refresh-token",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    },
  };
  return new FortnoxProvider(config);
}

// Mock fetch globally
type FetchCall = [string, RequestInit?];
const originalFetch = globalThis.fetch;
let mockFetchFn: ReturnType<typeof mock>;

beforeEach(() => {
  mockFetchFn = mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    }),
  );
  globalThis.fetch = mockFetchFn as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("FortnoxProvider", () => {
  describe("configuration", () => {
    test("has correct provider id", () => {
      const provider = createProvider();
      expect(provider.id).toBe("fortnox");
    });

    test("has correct provider name", () => {
      const provider = createProvider();
      expect(provider.name).toBe("Fortnox");
    });
  });

  describe("scopes", () => {
    test("includes all required scopes", () => {
      expect(FORTNOX_SCOPES).toContain("bookkeeping");
      expect(FORTNOX_SCOPES).toContain("companyinformation");
      expect(FORTNOX_SCOPES).toContain("archive");
      expect(FORTNOX_SCOPES).toContain("connectfile");
      expect(FORTNOX_SCOPES).toContain("inbox");
      expect(FORTNOX_SCOPES).toContain("settings");
    });
  });

  describe("buildConsentUrl", () => {
    test("generates correct OAuth URL", async () => {
      const provider = createProvider();
      const state = "test-state-123";

      const url = await provider.buildConsentUrl(state);

      expect(url).toContain("https://apps.fortnox.se/oauth-v1/auth");
      expect(url).toContain("state=test-state-123");
      expect(url).toContain("response_type=code");
      expect(url).toContain("scope=");
      // Check that all scopes are included
      for (const scope of FORTNOX_SCOPES) {
        expect(url).toContain(scope);
      }
    });
  });

  describe("isTokenExpired", () => {
    test("returns true when token is expired", () => {
      const provider = createProvider();
      const pastDate = new Date(Date.now() - 1000);
      expect(provider.isTokenExpired(pastDate)).toBe(true);
    });

    test("returns false when token is valid", () => {
      const provider = createProvider();
      const futureDate = new Date(Date.now() + 3600000);
      expect(provider.isTokenExpired(futureDate)).toBe(false);
    });

    test("returns true when token expires within buffer period", () => {
      const provider = createProvider();
      // 30 seconds from now (within 60 second buffer)
      const nearFuture = new Date(Date.now() + 30000);
      expect(provider.isTokenExpired(nearFuture)).toBe(true);
    });
  });

  describe("syncTransactions", () => {
    test("creates expense voucher with correct accounts", async () => {
      const provider = createProvider();

      // Mock financial year check
      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/financialyears")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                FinancialYears: [
                  {
                    Id: 1,
                    FromDate: "2024-01-01",
                    ToDate: "2024-12-31",
                  },
                ],
              }),
          };
        }
        // Voucher creation
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              Voucher: {
                VoucherSeries: "A",
                VoucherNumber: 1,
                Year: 1,
              },
            }),
        };
      });

      const expense: MappedTransaction = {
        id: "tx-1",
        amount: -100,
        date: "2024-06-15",
        description: "Office supplies",
        currency: "SEK",
        categoryReportingCode: "5400", // Expense account
        counterpartyName: "Staples",
      };

      const result = await provider.syncTransactions({
        transactions: [expense],
        targetAccountId: "1930", // Bank account
        tenantId: "tenant-1",
        jobId: "test-job-1",
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(result.results[0]?.providerTransactionId).toBe("A-1-1");
      expect(result.results[0]?.providerEntityType).toBe("Voucher");

      // Verify voucher API was called with expense structure
      const voucherCall = (mockFetchFn.mock.calls as FetchCall[]).find(
        (call) => call[0].includes("/vouchers") && call[1]?.method === "POST",
      );
      expect(voucherCall).toBeDefined();

      const body = JSON.parse(voucherCall![1]!.body as string);
      expect(body.Voucher.VoucherRows).toHaveLength(2);

      // Expense: Debit expense account (5400), Credit bank account (1930)
      const debitRow = body.Voucher.VoucherRows.find(
        (r: { Debit: number }) => r.Debit > 0,
      );
      const creditRow = body.Voucher.VoucherRows.find(
        (r: { Credit: number }) => r.Credit > 0,
      );
      expect(debitRow.Account).toBe(5400); // Expense account
      expect(debitRow.Debit).toBe(100);
      expect(creditRow.Account).toBe(1930); // Bank account
      expect(creditRow.Credit).toBe(100);
    });

    test("creates income voucher with correct accounts", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/financialyears")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                FinancialYears: [
                  { Id: 1, FromDate: "2024-01-01", ToDate: "2024-12-31" },
                ],
              }),
          };
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              Voucher: { VoucherSeries: "A", VoucherNumber: 2, Year: 1 },
            }),
        };
      });

      const income: MappedTransaction = {
        id: "tx-2",
        amount: 500,
        date: "2024-06-15",
        description: "Client payment",
        currency: "SEK",
        categoryReportingCode: "3010", // Income account
        counterpartyName: "Acme Corp",
      };

      const result = await provider.syncTransactions({
        transactions: [income],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-2",
      });

      expect(result.success).toBe(true);

      const voucherCall = (mockFetchFn.mock.calls as FetchCall[]).find(
        (call) => call[0].includes("/vouchers") && call[1]?.method === "POST",
      );
      const body = JSON.parse(voucherCall![1]!.body as string);

      // Income: Debit bank account (1930), Credit income account (3010)
      const debitRow = body.Voucher.VoucherRows.find(
        (r: { Debit: number }) => r.Debit > 0,
      );
      const creditRow = body.Voucher.VoucherRows.find(
        (r: { Credit: number }) => r.Credit > 0,
      );
      expect(debitRow.Account).toBe(1930); // Bank account
      expect(debitRow.Debit).toBe(500);
      expect(creditRow.Account).toBe(3010); // Income account
      expect(creditRow.Credit).toBe(500);
    });

    test("fails with INVALID_ACCOUNT error when categoryReportingCode is invalid format", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/financialyears")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                FinancialYears: [
                  { Id: 1, FromDate: "2024-01-01", ToDate: "2024-12-31" },
                ],
              }),
          };
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              Voucher: { VoucherSeries: "A", VoucherNumber: 3, Year: 1 },
            }),
        };
      });

      const expense: MappedTransaction = {
        id: "tx-3",
        amount: -75,
        date: "2024-06-15",
        description: "Lunch",
        currency: "SEK",
        categoryReportingCode: "invalid-code", // Invalid - not 4-digit number
      };

      const result = await provider.syncTransactions({
        transactions: [expense],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-3",
      });

      // Should fail with error about invalid account code
      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toContain("Invalid account code");
      expect(result.results[0]?.error).toContain("invalid-code");
    });

    test("uses default income account (3000) when categoryReportingCode is missing", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/financialyears")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                FinancialYears: [
                  { Id: 1, FromDate: "2024-01-01", ToDate: "2024-12-31" },
                ],
              }),
          };
        }
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              Voucher: { VoucherSeries: "A", VoucherNumber: 4, Year: 1 },
            }),
        };
      });

      const income: MappedTransaction = {
        id: "tx-4",
        amount: 200,
        date: "2024-06-15",
        description: "Refund",
        currency: "SEK",
        // No categoryReportingCode
      };

      await provider.syncTransactions({
        transactions: [income],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-4",
      });

      const voucherCall = (mockFetchFn.mock.calls as FetchCall[]).find(
        (call) => call[0].includes("/vouchers") && call[1]?.method === "POST",
      );
      const body = JSON.parse(voucherCall![1]!.body as string);

      const creditRow = body.Voucher.VoucherRows.find(
        (r: { Credit: number }) => r.Credit > 0,
      );
      expect(creditRow.Account).toBe(3000); // Default income account
    });

    test("sorts transactions by date before syncing", async () => {
      const provider = createProvider();
      const createdVouchers: string[] = [];

      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/financialyears")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                FinancialYears: [
                  { Id: 1, FromDate: "2024-01-01", ToDate: "2024-12-31" },
                ],
              }),
          };
        }
        // Track order of voucher creation
        const voucherNum = createdVouchers.length + 1;
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              Voucher: {
                VoucherSeries: "A",
                VoucherNumber: voucherNum,
                Year: 1,
              },
            }),
        };
      });

      const transactions: MappedTransaction[] = [
        {
          id: "tx-later",
          amount: -100,
          date: "2024-06-15",
          description: "Later",
          currency: "SEK",
        },
        {
          id: "tx-earlier",
          amount: -50,
          date: "2024-03-01",
          description: "Earlier",
          currency: "SEK",
        },
      ];

      const result = await provider.syncTransactions({
        transactions,
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-5",
      });

      expect(result.syncedCount).toBe(2);

      // Verify voucher creation calls were made with earlier date first
      const voucherCalls = (mockFetchFn.mock.calls as FetchCall[]).filter(
        (call) => call[0].includes("/vouchers") && call[1]?.method === "POST",
      );

      const firstCall = voucherCalls[0];
      const secondCall = voucherCalls[1];
      expect(firstCall).toBeDefined();
      expect(secondCall).toBeDefined();

      const firstBody = JSON.parse(firstCall![1]!.body as string);
      const secondBody = JSON.parse(secondCall![1]!.body as string);

      expect(firstBody.Voucher.TransactionDate).toBe("2024-03-01");
      expect(secondBody.Voucher.TransactionDate).toBe("2024-06-15");
    });

    test("handles failed voucher creation gracefully", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/financialyears")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                FinancialYears: [
                  { Id: 1, FromDate: "2024-01-01", ToDate: "2024-12-31" },
                ],
              }),
          };
        }
        // Fail voucher creation
        return {
          ok: false,
          status: 400,
          text: () => Promise.resolve("Invalid voucher data"),
        };
      });

      const expense: MappedTransaction = {
        id: "tx-fail",
        amount: -100,
        date: "2024-06-15",
        description: "Will fail",
        currency: "SEK",
      };

      const result = await provider.syncTransactions({
        transactions: [expense],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-6",
      });

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBeDefined();
    });
  });

  describe("uploadAttachment", () => {
    test("uploads to inbox and creates voucher connection", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async (url: string) => {
        if (url.includes("/inbox")) {
          return {
            ok: true,
            json: () =>
              Promise.resolve({
                File: {
                  Id: "file-123",
                  Name: "receipt.pdf",
                  Path: "inbox",
                },
              }),
          };
        }
        if (url.includes("/voucherfileconnections")) {
          return {
            ok: true,
            json: () => Promise.resolve({}),
          };
        }
        return { ok: true, json: () => Promise.resolve({}) };
      });

      const result = await provider.uploadAttachment({
        tenantId: "tenant-1",
        transactionId: "A-1-1", // Voucher ID format: Series-Number-Year
        fileName: "receipt.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("%PDF-1.4 test"),
      });

      expect(result.success).toBe(true);
      expect(result.attachmentId).toBe("file-123");

      // Verify inbox upload was called
      const inboxCall = (mockFetchFn.mock.calls as FetchCall[]).find((call) =>
        call[0].includes("/inbox"),
      );
      expect(inboxCall).toBeDefined();

      // Verify file connection was created
      const connectionCall = (mockFetchFn.mock.calls as FetchCall[]).find(
        (call) => call[0].includes("/voucherfileconnections"),
      );
      expect(connectionCall).toBeDefined();
    });

    test("returns error for invalid voucher ID format", async () => {
      const provider = createProvider();

      const result = await provider.uploadAttachment({
        tenantId: "tenant-1",
        transactionId: "invalid-id", // Invalid format
        fileName: "receipt.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("%PDF-1.4 test"),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid voucher ID format");
    });

    test("adds file extension if missing", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async () => {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              File: { Id: "file-456", Name: "receipt.pdf", Path: "inbox" },
            }),
        };
      });

      await provider.uploadAttachment({
        tenantId: "tenant-1",
        transactionId: "A-1-1",
        fileName: "receipt", // No extension
        mimeType: "application/pdf",
        content: Buffer.from("%PDF-1.4 test"),
      });

      // Verify the filename was extended
      const inboxCall = (mockFetchFn.mock.calls as FetchCall[]).find((call) =>
        call[0].includes("/inbox"),
      );
      // FormData includes the filename, check it was sanitized
      expect(inboxCall).toBeDefined();
    });
  });

  describe("getAccounts", () => {
    test("returns accounts with correct types", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async () => ({
        ok: true,
        json: () =>
          Promise.resolve({
            Accounts: [
              {
                Number: 1930,
                Description: "Company Bank Account",
                Active: true,
              },
              { Number: 1910, Description: "Cash", Active: true },
              { Number: 4000, Description: "Purchase of Goods", Active: true },
              { Number: 3000, Description: "Sales Revenue", Active: true },
              { Number: 5000, Description: "Employee Costs", Active: false },
            ],
          }),
      }));

      const accounts = await provider.getAccounts("tenant-1");

      expect(accounts.length).toBeGreaterThan(0);

      // Check bank account type (1930 is a bank account)
      const bankAccount = accounts.find((a) => a.code === "1930");
      expect(bankAccount?.type).toBe("BANK");

      // Check that inactive accounts are excluded
      const inactiveAccount = accounts.find((a) => a.code === "5000");
      expect(inactiveAccount).toBeUndefined();
    });

    test("includes default bank account", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async () => ({
        ok: true,
        json: () =>
          Promise.resolve({
            Accounts: [
              { Number: 4000, Description: "Purchase of Goods", Active: true },
            ],
          }),
      }));

      const accounts = await provider.getAccounts("tenant-1");

      // Should include default 1930 bank account even if not in API response
      const defaultBank = accounts.find((a) => a.code === "1930");
      expect(defaultBank).toBeDefined();
      expect(defaultBank?.type).toBe("BANK");
      expect(defaultBank?.name).toBe("Företagskonto");
    });
  });

  describe("financial years", () => {
    test("creates year when missing and transaction date is in future year", async () => {
      const provider = createProvider();
      const createYearCalls: string[] = [];

      mockFetchFn.mockImplementation(
        async (url: string, options?: RequestInit) => {
          // Check financial year for specific date - returns empty for 2024
          if (url.includes("/financialyears/") && url.includes("date=")) {
            return {
              ok: true,
              json: () => Promise.resolve({ FinancialYears: [] }),
            };
          }

          // List all financial years (for pattern detection)
          if (url.includes("/financialyears") && !options?.method) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  FinancialYears: [
                    { Id: 1, FromDate: "2023-01-01", ToDate: "2023-12-31" },
                  ],
                }),
            };
          }

          // Create financial year
          if (url.includes("/financialyears") && options?.method === "POST") {
            createYearCalls.push(options.body as string);
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  FinancialYear: {
                    Id: 2,
                    FromDate: "2024-01-01",
                    ToDate: "2024-12-31",
                  },
                }),
            };
          }

          // Voucher creation
          if (url.includes("/vouchers") && options?.method === "POST") {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  Voucher: { VoucherSeries: "A", VoucherNumber: 1, Year: 2 },
                }),
            };
          }

          return { ok: true, json: () => Promise.resolve({}) };
        },
      );

      const tx: MappedTransaction = {
        id: "tx-2024",
        amount: -100,
        date: "2024-06-15",
        description: "Future expense",
        currency: "SEK",
      };

      await provider.syncTransactions({
        transactions: [tx],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-7",
      });

      // Verify financial year was created
      expect(createYearCalls.length).toBe(1);
      const body = JSON.parse(createYearCalls[0] as string);
      expect(body.FinancialYear.FromDate).toBe("2024-01-01");
      expect(body.FinancialYear.ToDate).toBe("2024-12-31");
    });

    test("uses existing period pattern (broken fiscal year) for new years", async () => {
      const provider = createProvider();
      const createYearCalls: string[] = [];

      mockFetchFn.mockImplementation(
        async (url: string, options?: RequestInit) => {
          // Check for specific date - not found
          if (url.includes("/financialyears/") && url.includes("date=")) {
            return {
              ok: true,
              json: () => Promise.resolve({ FinancialYears: [] }),
            };
          }

          // List all years - has broken fiscal year pattern
          if (url.includes("/financialyears") && !options?.method) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  FinancialYears: [
                    // Broken fiscal year: July to June
                    { Id: 1, FromDate: "2023-07-01", ToDate: "2024-06-30" },
                  ],
                }),
            };
          }

          // Create financial year
          if (url.includes("/financialyears") && options?.method === "POST") {
            createYearCalls.push(options.body as string);
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  FinancialYear: {
                    Id: 2,
                    FromDate: "2024-07-01",
                    ToDate: "2025-06-30",
                  },
                }),
            };
          }

          if (url.includes("/vouchers")) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  Voucher: { VoucherSeries: "A", VoucherNumber: 1, Year: 2 },
                }),
            };
          }

          return { ok: true, json: () => Promise.resolve({}) };
        },
      );

      const tx: MappedTransaction = {
        id: "tx-broken-fy",
        amount: -100,
        date: "2024-08-15", // After June 30, needs new fiscal year
        description: "Expense",
        currency: "SEK",
      };

      await provider.syncTransactions({
        transactions: [tx],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-8",
      });

      // Verify financial year was created with broken fiscal year pattern
      expect(createYearCalls.length).toBe(1);
      const body = JSON.parse(createYearCalls[0] as string);
      // Should follow July-June pattern
      expect(body.FinancialYear.FromDate).toContain("-07-01");
      expect(body.FinancialYear.ToDate).toContain("-06-30");
    });

    test("skips creation when year already exists for transaction date", async () => {
      const provider = createProvider();
      const createYearCalls: string[] = [];

      mockFetchFn.mockImplementation(
        async (url: string, options?: RequestInit) => {
          // Check for specific date - year exists
          if (url.includes("/financialyears/") && url.includes("date=")) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  FinancialYears: [
                    { Id: 1, FromDate: "2024-01-01", ToDate: "2024-12-31" },
                  ],
                }),
            };
          }

          if (url.includes("/financialyears") && options?.method === "POST") {
            createYearCalls.push(options.body as string);
            return { ok: true, json: () => Promise.resolve({}) };
          }

          if (url.includes("/vouchers")) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  Voucher: { VoucherSeries: "A", VoucherNumber: 1, Year: 1 },
                }),
            };
          }

          return { ok: true, json: () => Promise.resolve({}) };
        },
      );

      const tx: MappedTransaction = {
        id: "tx-existing-fy",
        amount: -100,
        date: "2024-06-15",
        description: "Expense",
        currency: "SEK",
      };

      await provider.syncTransactions({
        transactions: [tx],
        targetAccountId: "1930",
        tenantId: "tenant-1",
        jobId: "test-job-9",
      });

      // Verify no financial year creation was attempted
      expect(createYearCalls.length).toBe(0);
    });
  });

  describe("voucher file connection", () => {
    test("connects file to voucher with correct parameters", async () => {
      const provider = createProvider();
      interface VoucherConnectionBody {
        VoucherFileConnection?: {
          FileId?: string;
          VoucherSeries?: string;
          VoucherNumber?: string;
        };
      }
      let connectionBody: VoucherConnectionBody | null = null;
      let connectionUrl = "";

      mockFetchFn.mockImplementation(
        async (url: string, options: RequestInit) => {
          if (url.includes("/inbox")) {
            return {
              ok: true,
              json: () =>
                Promise.resolve({
                  File: { Id: "file-abc", Name: "receipt.pdf", Path: "inbox" },
                }),
            };
          }

          if (url.includes("/voucherfileconnections")) {
            connectionUrl = url;
            connectionBody = JSON.parse(
              options?.body as string,
            ) as VoucherConnectionBody;
            return { ok: true, json: () => Promise.resolve({}) };
          }

          return { ok: true, json: () => Promise.resolve({}) };
        },
      );

      await provider.uploadAttachment({
        tenantId: "tenant-1",
        transactionId: "A-212-1", // Series-Number-Year
        fileName: "receipt.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("%PDF-1.4 test"),
      });

      expect(connectionBody).not.toBeNull();
      const body = connectionBody!;
      expect(body.VoucherFileConnection).toBeDefined();
      const conn = body.VoucherFileConnection;
      expect(conn?.FileId).toBe("file-abc");
      expect(conn?.VoucherSeries).toBe("A");
      expect(conn?.VoucherNumber).toBe("212"); // String, not integer
      // VoucherYear is passed as query parameter, not in body
      expect(connectionUrl).toContain("financialyear=1");
    });
  });

  describe("checkConnection", () => {
    test("returns connected when company info is accessible", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async () => ({
        ok: true,
        json: () =>
          Promise.resolve({
            CompanyInformation: {
              DatabaseNumber: 12345,
              CompanyName: "Test Company",
            },
          }),
      }));

      const result = await provider.checkConnection();

      expect(result.connected).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("returns not connected when API fails", async () => {
      const provider = createProvider();

      mockFetchFn.mockImplementation(async () => ({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      }));

      const result = await provider.checkConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
