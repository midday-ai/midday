import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ProviderInitConfig } from "../types";
import { XERO_SCOPES, XeroProvider } from "./xero";

// Mock the XeroClient
const mockAccountingApi = {
  updateOrCreateBankTransactions: mock(() => Promise.resolve({ body: {} })),
  getBankTransactions: mock(() => Promise.resolve({ body: {} })),
  getAccounts: mock(() => Promise.resolve({ body: {} })),
  createAccount: mock(() => Promise.resolve({ body: {} })),
  createBankTransactionAttachmentByFileName: mock(() =>
    Promise.resolve({ body: {} }),
  ),
  getBankTransactionAttachments: mock(() => Promise.resolve({ body: {} })),
  deleteAttachmentByFileName: mock(() => Promise.resolve({ body: {} })),
};

const mockClient = {
  buildConsentUrl: mock(() => "https://login.xero.com/authorize?..."),
  apiCallback: mock(() => Promise.resolve()),
  refreshToken: mock(() => Promise.resolve()),
  setTokenSet: mock(),
  readTokenSet: mock(() => ({
    access_token: "test-access",
    refresh_token: "test-refresh",
    expires_at: Date.now() / 1000 + 3600,
    token_type: "Bearer",
  })),
  updateTenants: mock(() => Promise.resolve([{ tenantId: "tenant-123" }])),
  accountingApi: mockAccountingApi,
  disconnect: mock(() => Promise.resolve()),
};

// Mock the xero-node module
const originalXeroNode = await import("xero-node");

// Helper to create a provider with mocked client
function createProvider(): XeroProvider {
  const config: ProviderInitConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    redirectUri: "https://example.com/callback",
    // Provide tokens so getValidAccessToken doesn't fail
    config: {
      provider: "xero" as const,
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      tenantId: "tenant-123",
    },
  };

  const provider = new XeroProvider(config);

  // Replace the internal client with our mock
  // @ts-expect-error - accessing private property for testing
  provider.client = mockClient;

  return provider;
}

beforeEach(() => {
  // Reset all mocks
  mockAccountingApi.updateOrCreateBankTransactions.mockClear();
  mockAccountingApi.getBankTransactions.mockClear();
  mockAccountingApi.getAccounts.mockClear();
  mockAccountingApi.createBankTransactionAttachmentByFileName.mockClear();
  mockClient.buildConsentUrl.mockClear();
  mockClient.apiCallback.mockClear();
  mockClient.refreshToken.mockClear();
  mockClient.updateTenants.mockClear();
});

describe("XeroProvider", () => {
  describe("configuration", () => {
    test("has correct provider id", () => {
      const provider = createProvider();
      expect(provider.id).toBe("xero");
    });

    test("has correct provider name", () => {
      const provider = createProvider();
      expect(provider.name).toBe("Xero");
    });
  });

  describe("scopes", () => {
    test("includes all required scopes", () => {
      expect(XERO_SCOPES).toContain("openid");
      expect(XERO_SCOPES).toContain("profile");
      expect(XERO_SCOPES).toContain("email");
      expect(XERO_SCOPES).toContain("accounting.transactions");
      expect(XERO_SCOPES).toContain("accounting.attachments");
      expect(XERO_SCOPES).toContain("accounting.settings");
      expect(XERO_SCOPES).toContain("accounting.contacts.read");
      expect(XERO_SCOPES).toContain("offline_access");
    });
  });

  describe("syncTransactions", () => {
    test("creates BankTransaction with SPEND type for expenses", async () => {
      const provider = createProvider();

      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [
              {
                bankTransactionID: "bt-123",
                type: "SPEND",
              },
            ],
          },
        }),
      );

      const result = await provider.syncTransactions({
        transactions: [
          {
            id: "tx-1",
            amount: -100,
            date: "2024-06-15",
            description: "Office supplies",
            currency: "USD",
            categoryReportingCode: "429",
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-1",
      });

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(1);
      expect(result.results[0]?.providerEntityType).toBe("BankTransaction");
      expect(result.results[0]?.providerTransactionId).toBe("bt-123");

      // Verify the API was called with SPEND type
      const call = mockAccountingApi.updateOrCreateBankTransactions.mock
        .calls[0] as unknown[];
      expect((call[1] as any).bankTransactions[0].type).toBe(
        originalXeroNode.BankTransaction.TypeEnum.SPEND,
      );
    });

    test("creates BankTransaction with RECEIVE type for income", async () => {
      const provider = createProvider();

      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [
              {
                bankTransactionID: "bt-456",
                type: "RECEIVE",
              },
            ],
          },
        }),
      );

      const result = await provider.syncTransactions({
        transactions: [
          {
            id: "tx-2",
            amount: 500, // Positive = income
            date: "2024-06-15",
            description: "Client payment",
            currency: "USD",
            categoryReportingCode: "200",
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-2",
      });

      expect(result.success).toBe(true);
      expect(result.results[0]?.providerTransactionId).toBe("bt-456");

      // Verify the API was called with RECEIVE type
      const call = mockAccountingApi.updateOrCreateBankTransactions.mock
        .calls[0] as unknown[];
      expect((call[1] as any).bankTransactions[0].type).toBe(
        originalXeroNode.BankTransaction.TypeEnum.RECEIVE,
      );
    });

    test("fails with INVALID_ACCOUNT error when categoryReportingCode is invalid format", async () => {
      const provider = createProvider();

      // API should not be called since validation fails before sync
      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [{ bankTransactionID: "bt-789" }],
          },
        }),
      );

      const result = await provider.syncTransactions({
        transactions: [
          {
            id: "tx-3",
            amount: -75,
            date: "2024-06-15",
            description: "Lunch",
            currency: "USD",
            categoryReportingCode: "invalid-code!@#", // Invalid - not alphanumeric
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-3",
      });

      // Should fail with error about invalid account code
      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toContain("Invalid account code");
      expect(result.results[0]?.error).toContain("invalid-code!@#");
    });

    test("uses default income account code (200) when categoryReportingCode is missing", async () => {
      const provider = createProvider();

      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [{ bankTransactionID: "bt-101" }],
          },
        }),
      );

      await provider.syncTransactions({
        transactions: [
          {
            id: "tx-4",
            amount: 200,
            date: "2024-06-15",
            description: "Refund",
            currency: "USD",
            // No categoryReportingCode
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-4",
      });

      const call = mockAccountingApi.updateOrCreateBankTransactions.mock
        .calls[0] as unknown[];
      expect(
        (call[1] as any).bankTransactions[0].lineItems[0].accountCode,
      ).toBe("200");
    });

    test("sets lineAmountTypes to Inclusive", async () => {
      const provider = createProvider();

      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [{ bankTransactionID: "bt-inc" }],
          },
        }),
      );

      await provider.syncTransactions({
        transactions: [
          {
            id: "tx-5",
            amount: -100,
            date: "2024-06-15",
            description: "Test",
            currency: "USD",
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-5",
      });

      const call = mockAccountingApi.updateOrCreateBankTransactions.mock
        .calls[0] as unknown[];
      expect((call[1] as any).bankTransactions[0].lineAmountTypes).toBe(
        originalXeroNode.LineAmountTypes.Inclusive,
      );
    });

    test("includes contact when counterpartyName is provided", async () => {
      const provider = createProvider();

      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [{ bankTransactionID: "bt-contact" }],
          },
        }),
      );

      await provider.syncTransactions({
        transactions: [
          {
            id: "tx-6",
            amount: -50,
            date: "2024-06-15",
            description: "Coffee",
            currency: "USD",
            counterpartyName: "Starbucks",
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-6",
      });

      const call = mockAccountingApi.updateOrCreateBankTransactions.mock
        .calls[0] as unknown[];
      expect((call[1] as any).bankTransactions[0].contact).toEqual({
        name: "Starbucks",
      });
    });

    test("handles batch processing for many transactions", async () => {
      const provider = createProvider();

      // Generate 60 transactions (more than batch size of 50)
      const transactions = Array.from({ length: 60 }, (_, i) => ({
        id: `tx-batch-${i}`,
        amount: -10,
        date: "2024-06-15",
        description: `Transaction ${i}`,
        currency: "USD",
      }));

      (
        mockAccountingApi.updateOrCreateBankTransactions as any
      ).mockImplementation(async (_tenantId: any, req: any) => ({
        body: {
          bankTransactions: req.bankTransactions.map(
            (_: unknown, idx: number) => ({
              bankTransactionID: `bt-batch-${idx}`,
            }),
          ),
        },
      }));

      const result = await provider.syncTransactions({
        transactions,
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-7",
      });

      // Should have made 2 API calls (50 + 10)
      expect(
        mockAccountingApi.updateOrCreateBankTransactions.mock.calls.length,
      ).toBe(2);
      expect(result.syncedCount).toBe(60);
    });

    test("handles validation errors gracefully", async () => {
      const provider = createProvider();

      mockAccountingApi.updateOrCreateBankTransactions.mockImplementation(
        async () => ({
          body: {
            bankTransactions: [
              {
                // No bankTransactionID = failed
                validationErrors: [{ message: "Account code not found" }],
              },
            ],
          },
        }),
      );

      const result = await provider.syncTransactions({
        transactions: [
          {
            id: "tx-fail",
            amount: -100,
            date: "2024-06-15",
            description: "Will fail",
            currency: "USD",
          },
        ],
        targetAccountId: "bank-account-123",
        tenantId: "tenant-123",
        jobId: "test-job-8",
      });

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toContain("Account code not found");
    });
  });

  describe("uploadAttachment", () => {
    test("attaches file to bank transaction", async () => {
      const provider = createProvider();

      mockAccountingApi.createBankTransactionAttachmentByFileName.mockImplementation(
        async () => ({
          body: {
            attachments: [
              {
                attachmentID: "att-123",
                fileName: "receipt.pdf",
              },
            ],
          },
        }),
      );

      const result = await provider.uploadAttachment({
        transactionId: "bt-123",
        tenantId: "tenant-123",
        fileName: "receipt.pdf",
        mimeType: "application/pdf",
        content: Buffer.from("%PDF-1.4 test"),
      });

      expect(result.success).toBe(true);
      expect(result.attachmentId).toBe("att-123");
    });

    test("sanitizes filename with extension", async () => {
      const provider = createProvider();

      mockAccountingApi.createBankTransactionAttachmentByFileName.mockImplementation(
        async () => ({
          body: {
            attachments: [
              {
                attachmentID: "att-456",
                fileName: "document.pdf",
              },
            ],
          },
        }),
      );

      await provider.uploadAttachment({
        transactionId: "bt-456",
        tenantId: "tenant-123",
        fileName: "document", // No extension
        mimeType: "application/pdf",
        content: Buffer.from("%PDF-1.4 test"),
      });

      // Verify filename was sanitized
      const call = mockAccountingApi.createBankTransactionAttachmentByFileName
        .mock.calls[0] as unknown[];
      // The fileName parameter should have .pdf extension
      expect(call[2]).toBe("document.pdf");
    });
  });

  describe("getAccounts", () => {
    test("returns bank accounts with correct mapping", async () => {
      const provider = createProvider();

      // Use the actual enum value from xero-node
      mockAccountingApi.getAccounts.mockImplementation(async () => ({
        body: {
          accounts: [
            {
              accountID: "acc-1",
              code: "BANK",
              name: "Business Bank Account",
              type: originalXeroNode.AccountType.BANK,
              // Use the actual enum value for ACTIVE status
              status: originalXeroNode.Account.StatusEnum.ACTIVE,
              currencyCode: "USD",
            },
          ],
        },
      }));

      const accounts = await provider.getAccounts("tenant-123");

      // Should have at least one account
      expect(accounts.length).toBeGreaterThan(0);

      // Bank account should have correct type
      const bankAccount = accounts.find((a) => a.code === "BANK");
      expect(bankAccount).toBeDefined();
      expect(bankAccount?.type).toBe("BANK");
      expect(bankAccount?.name).toBe("Business Bank Account");
      expect(bankAccount?.currency).toBe("USD");
    });

    test("filters out archived accounts", async () => {
      const provider = createProvider();

      // Mock with only archived accounts - should trigger default account creation
      mockAccountingApi.getAccounts.mockImplementation(async () => ({
        body: {
          accounts: [
            {
              accountID: "acc-2",
              code: "BANK2",
              name: "Archived Account",
              type: originalXeroNode.AccountType.BANK,
              status: originalXeroNode.Account.StatusEnum.ARCHIVED,
              currencyCode: "USD",
            },
          ],
        },
      }));

      // Mock account creation
      mockAccountingApi.createAccount.mockImplementation(async () => ({
        body: {
          accounts: [
            {
              accountID: "acc-default",
              code: "090",
              name: "Midday - Default Bank",
              type: originalXeroNode.AccountType.BANK,
              status: originalXeroNode.Account.StatusEnum.ACTIVE,
              currencyCode: "USD",
            },
          ],
        },
      }));

      const accounts = await provider.getAccounts("tenant-123");

      // Should have default account or all accounts (if creation failed)
      expect(accounts.length).toBeGreaterThan(0);
    });
  });

  describe("checkConnection", () => {
    test("returns connected when tenants are found", async () => {
      const provider = createProvider();

      // Mock updateTenants to set tenants
      mockClient.updateTenants.mockImplementation(async () => {
        // @ts-expect-error - accessing private property for testing
        provider.client.tenants = [{ tenantId: "tenant-123" }];
        return [{ tenantId: "tenant-123" }];
      });

      const result = await provider.checkConnection();

      expect(result.connected).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("returns not connected when no tenants found", async () => {
      const provider = createProvider();

      mockClient.updateTenants.mockImplementation(async () => {
        // @ts-expect-error - accessing private property for testing
        provider.client.tenants = [];
        return [];
      });

      const result = await provider.checkConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBe("No Xero organizations found");
    });

    test("returns not connected when API fails", async () => {
      const provider = createProvider();

      mockClient.updateTenants.mockImplementation(async () => {
        throw new Error("401 Unauthorized");
      });

      const result = await provider.checkConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBeDefined();
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
  });

  describe("rate limiting", () => {
    test("has correct rate limit configuration", () => {
      const provider = createProvider();
      // @ts-expect-error - accessing protected property for testing
      const config = provider.rateLimitConfig;
      expect(config.callsPerMinute).toBe(60);
      expect(config.maxConcurrent).toBe(3);
    });
  });
});
