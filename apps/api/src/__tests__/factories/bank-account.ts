/**
 * Bank account test data factories.
 */

interface BankAccountConnection {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface BankAccountResponse {
  id: string;
  name: string;
  currency: string;
  enabled: boolean;
  manual: boolean;
  balance: number | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  connection: BankAccountConnection | null;
}

interface BankAccountInput {
  name: string;
  currency: string;
}

export function createValidBankAccountResponse(
  overrides: Partial<BankAccountResponse> = {},
): BankAccountResponse {
  return {
    id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    name: "Business Checking",
    currency: "USD",
    enabled: true,
    manual: false,
    balance: 50000,
    type: "checking",
    createdAt: "2024-05-01T00:00:00.000Z",
    updatedAt: "2024-05-01T00:00:00.000Z",
    connection: {
      id: "conn-123",
      name: "Chase Bank",
      logoUrl: null,
    },
    ...overrides,
  };
}

export function createMinimalBankAccountResponse(): BankAccountResponse {
  return createValidBankAccountResponse({
    balance: null,
    connection: null,
  });
}

export function createBankAccountInput(
  overrides: Partial<BankAccountInput> = {},
): BankAccountInput {
  return {
    name: "New Account",
    currency: "USD",
    ...overrides,
  };
}
