import { expect, test } from "bun:test";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

test("Transform expense transaction (depository)", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        transactionId:
          "8wwecA0PsWWCLPLazQzht2oOcxSIQ5UlWPHaNBpC3tjYtc002faJcjWzRpyO4sjz66kRpb7_5rA",
        entryReference: "5490990006",
        bookingDate: "2024-02-23",
        valueDate: "2024-02-23",
        transactionAmount: {
          amount: "-38000.00",
          currency: "SEK",
        },
        additionalInformation: "LÖN         160434262327",
        proprietaryBankTransactionCode: "Transfer",
        internalTransactionId: "86b1bc36e6a6d2a5dee8ff7138920255",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform income transaction (depository)", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        transactionId: "income-test-123",
        bookingDate: "2024-02-23",
        transactionAmount: {
          amount: "5000.00",
          currency: "SEK",
        },
        additionalInformation: "Salary deposit",
        proprietaryBankTransactionCode: "Transfer",
        internalTransactionId: "income-internal-123",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card payment - should be credit-card-payment not income", () => {
  // When paying off a credit card, the amount is positive (money coming INTO the card)
  // This should NOT be categorized as income
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        transactionId: "cc-payment-123",
        bookingDate: "2024-02-23",
        transactionAmount: {
          amount: "500.00",
          currency: "SEK",
        },
        additionalInformation: "Credit card payment",
        proprietaryBankTransactionCode: "Transfer",
        internalTransactionId: "cc-payment-internal-123",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card refund - should be null (user categorizes)", () => {
  // A refund on a credit card also has positive amount but is not a payment
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        transactionId: "cc-refund-123",
        bookingDate: "2024-02-23",
        transactionAmount: {
          amount: "75.00",
          currency: "SEK",
        },
        creditorName: "Some Merchant",
        additionalInformation: "Refund",
        proprietaryBankTransactionCode: "Card purchase",
        internalTransactionId: "cc-refund-internal-123",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform accounts", () => {
  // Get the transformed account
  const transformedAccount = transformAccount({
    id: "b11e5627-cac8-41c9-a74a-2b88438fe07d",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "3133",
    institution_id: "PLEO_PLEODK00",
    status: "READY",
    owner_name: "",
    account: {
      resourceId: "3133",
      currency: "SEK",
      name: "Pleo Account",
      product: "Pleo",
      cashAccountType: "TRAN",
      iban: "123",
      ownerName: "Name",
    },
    balance: {
      currency: "SEK",
      amount: "1942682.86",
    },
    institution: {
      id: "PLEO_PLEODK00",
      name: "Pleo",
      bic: "PLEODK00",
      transaction_total_days: "90",
      countries: ["DK", "GB", "DE", "SE", "ES", "IE", "DK"],
      logo: "https://cdn-logos.gocardless.com/ais/PLEO_PLEODK00.png",
    },
  });

  // Create a stable version of the account for snapshot testing
  // by replacing the dynamic expires_at date with a fixed string
  const stableAccount = {
    ...transformedAccount,
    expires_at: "FIXED_DATE_FOR_TESTING",
  };

  expect(stableAccount).toMatchSnapshot();
});

test("Transform credit card account (CARD type)", () => {
  const transformedAccount = transformAccount({
    id: "credit-card-account-123",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "4444",
    institution_id: "BANK_CREDIT",
    status: "READY",
    owner_name: "John Doe",
    account: {
      resourceId: "4444",
      currency: "EUR",
      name: "Credit Card",
      product: "Visa Gold",
      cashAccountType: "CARD",
      iban: "4444",
      ownerName: "John Doe",
    },
    balance: {
      currency: "EUR",
      amount: "-1500.00",
    },
    institution: {
      id: "BANK_CREDIT",
      name: "Test Bank",
      bic: "TESTBIC",
      transaction_total_days: "90",
      countries: ["DE"],
      logo: "https://example.com/logo.png",
    },
  });

  const stableAccount = {
    ...transformedAccount,
    expires_at: "FIXED_DATE_FOR_TESTING",
  };

  expect(stableAccount).toMatchSnapshot();
});

test("Transform account balance - depository (positive stays positive)", () => {
  expect(
    transformAccountBalance({
      balance: {
        currency: "SEK",
        amount: "1942682.86",
      },
      accountType: "depository",
    }),
  ).toMatchSnapshot();
});

test("Transform account balance - credit card with negative balance (normalized to positive)", () => {
  // GoCardless stores credit card debt as NEGATIVE (e.g., -1500 means $1500 owed)
  // We normalize to positive for consistency with other providers
  expect(
    transformAccountBalance({
      balance: {
        currency: "EUR",
        amount: "-1500.00",
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "EUR",
    amount: 1500,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - credit card with positive balance (overpayment stays positive)", () => {
  // If someone overpays their credit card, the balance is positive (credit in their favor)
  // This should stay positive
  expect(
    transformAccountBalance({
      balance: {
        currency: "EUR",
        amount: "200.00",
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "EUR",
    amount: 200,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - credit card with zero balance", () => {
  expect(
    transformAccountBalance({
      balance: {
        currency: "USD",
        amount: "0.00",
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "USD",
    amount: 0,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - no accountType provided", () => {
  // When accountType is not provided, don't normalize (safety for backwards compatibility)
  expect(
    transformAccountBalance({
      balance: {
        currency: "EUR",
        amount: "-500.00",
      },
    }),
  ).toEqual({
    currency: "EUR",
    amount: -500,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - handles undefined balance gracefully", () => {
  expect(
    transformAccountBalance({
      balance: undefined,
      accountType: "depository",
    }),
  ).toEqual({
    currency: "XXX",
    amount: 0,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - very large credit card balance", () => {
  // Verify large balances are normalized correctly
  expect(
    transformAccountBalance({
      balance: {
        currency: "USD",
        amount: "-50000.00",
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "USD",
    amount: 50000,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - decimal precision maintained", () => {
  expect(
    transformAccountBalance({
      balance: {
        currency: "EUR",
        amount: "-1234.56",
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "EUR",
    amount: 1234.56,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - loan type keeps negative (if bank reports that way)", () => {
  // Note: GoCardless transform only normalizes credit cards, not loans
  // Loans are typically reported as positive by banks anyway
  // This test documents the current behavior
  expect(
    transformAccountBalance({
      balance: {
        currency: "GBP",
        amount: "-25000.00",
      },
      accountType: "loan",
    }),
  ).toEqual({
    currency: "GBP",
    amount: -25000, // Not normalized (only credit type is normalized)
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - loan type with positive value", () => {
  // Most banks report loan balances as positive (amount owed)
  expect(
    transformAccountBalance({
      balance: {
        currency: "GBP",
        amount: "25000.00",
      },
      accountType: "loan",
    }),
  ).toEqual({
    currency: "GBP",
    amount: 25000,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account - extracts available_balance from balances array", () => {
  const result = transformAccount({
    id: "gc_account_123",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "DE89370400440532013000",
    institution_id: "REVOLUT_REVOGB21",
    status: "READY",
    owner_name: "John Doe",
    account: {
      currency: "EUR",
      iban: "DE89370400440532013000",
      ownerName: "John Doe",
      name: "Main Account",
      product: "Current Account",
      cashAccountType: "CACC",
      resourceId: "resource_123",
    },
    balance: {
      currency: "EUR",
      amount: "5000.00",
    },
    balances: [
      {
        balanceType: "interimBooked",
        balanceAmount: { amount: "5000.00", currency: "EUR" },
        creditLimitIncluded: false,
      },
      {
        balanceType: "interimAvailable",
        balanceAmount: { amount: "4800.00", currency: "EUR" },
        creditLimitIncluded: false,
      },
    ],
    institution: {
      id: "REVOLUT_REVOGB21",
      name: "Revolut",
      bic: "REVOGB21",
      transaction_total_days: "90",
      countries: ["GB"],
      logo: "https://cdn.nordigen.com/revolut.png",
    },
  });

  expect(result.available_balance).toBe(4800);
  expect(result.credit_limit).toBeNull(); // GoCardless doesn't provide credit limit
});

test("Transform account - available_balance falls back to expected balance", () => {
  const result = transformAccount({
    id: "gc_account_456",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "DE89370400440532013001",
    institution_id: "REVOLUT_REVOGB21",
    status: "READY",
    owner_name: "Jane Doe",
    account: {
      currency: "EUR",
      iban: "DE89370400440532013001",
      ownerName: "Jane Doe",
      name: "Savings",
      product: "Savings Account",
      cashAccountType: "SVGS",
      resourceId: "resource_456",
    },
    balance: {
      currency: "EUR",
      amount: "10000.00",
    },
    balances: [
      {
        balanceType: "expected",
        balanceAmount: { amount: "10000.00", currency: "EUR" },
        creditLimitIncluded: false,
      },
    ],
    institution: {
      id: "REVOLUT_REVOGB21",
      name: "Revolut",
      bic: "REVOGB21",
      transaction_total_days: "90",
      countries: ["GB"],
      logo: "https://cdn.nordigen.com/revolut.png",
    },
  });

  expect(result.available_balance).toBe(10000);
});

test("Transform account - handles empty balances array", () => {
  const result = transformAccount({
    id: "gc_account_789",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "GB82WEST12345698765432",
    institution_id: "MONZO_MONZGB21",
    status: "READY",
    owner_name: "Test User",
    account: {
      currency: "GBP",
      iban: "GB82WEST12345698765432",
      ownerName: "Test User",
      name: "Current",
      product: "Current Account",
      cashAccountType: "CACC",
      resourceId: "resource_789",
    },
    balance: {
      currency: "GBP",
      amount: "1000.00",
    },
    balances: [],
    institution: {
      id: "MONZO_MONZGB21",
      name: "Monzo",
      bic: "MONZGB21",
      transaction_total_days: "90",
      countries: ["GB"],
      logo: "https://cdn.nordigen.com/monzo.png",
    },
  });

  expect(result.available_balance).toBeNull();
  expect(result.credit_limit).toBeNull();
});

test("Transform account - XXX currency resolved from balance", () => {
  const result = transformAccount({
    id: "gc_xxx_balance",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "DE89370400440532013002",
    institution_id: "BANK_XXX",
    status: "READY",
    owner_name: "Test User",
    account: {
      currency: "XXX",
      iban: "DE89370400440532013002",
      ownerName: "Test User",
      name: "Main Account",
      product: "Current Account",
      cashAccountType: "CACC",
      resourceId: "resource_xxx",
    },
    balance: {
      currency: "EUR",
      amount: "5000.00",
    },
    balances: [
      {
        balanceType: "interimAvailable",
        balanceAmount: { amount: "5000.00", currency: "EUR" },
        creditLimitIncluded: false,
      },
    ],
    institution: {
      id: "BANK_XXX",
      name: "Test Bank",
      bic: "TESTBIC",
      transaction_total_days: "90",
      countries: ["DE"],
      logo: "https://example.com/logo.png",
    },
  });

  expect(result.currency).toBe("EUR");
  expect(result.balance.currency).toBe("EUR");
});

test("Transform account - XXX currency resolved from balances array when balance also XXX", () => {
  const result = transformAccount({
    id: "gc_xxx_balances_arr",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "DE89370400440532013003",
    institution_id: "BANK_XXX2",
    status: "READY",
    owner_name: "Test User",
    account: {
      currency: "XXX",
      iban: "DE89370400440532013003",
      ownerName: "Test User",
      name: "Main Account",
      product: "Current Account",
      cashAccountType: "CACC",
      resourceId: "resource_xxx2",
    },
    balance: {
      currency: "XXX",
      amount: "3000.00",
    },
    balances: [
      {
        balanceType: "interimBooked",
        balanceAmount: { amount: "3000.00", currency: "EUR" },
        creditLimitIncluded: false,
      },
    ],
    institution: {
      id: "BANK_XXX2",
      name: "Test Bank",
      bic: "TESTBIC",
      transaction_total_days: "90",
      countries: ["DE"],
      logo: "https://example.com/logo.png",
    },
  });

  expect(result.currency).toBe("EUR");
  expect(result.balance.currency).toBe("EUR");
});

test("Transform account - XXX preserved when all sources are XXX", () => {
  const result = transformAccount({
    id: "gc_all_xxx",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "DE89370400440532013004",
    institution_id: "BANK_ALL_XXX",
    status: "READY",
    owner_name: "Test User",
    account: {
      currency: "XXX",
      iban: "DE89370400440532013004",
      ownerName: "Test User",
      name: "Main Account",
      product: "Current Account",
      cashAccountType: "CACC",
      resourceId: "resource_all_xxx",
    },
    balance: {
      currency: "XXX",
      amount: "1000.00",
    },
    balances: [
      {
        balanceType: "interimBooked",
        balanceAmount: { amount: "1000.00", currency: "XXX" },
        creditLimitIncluded: false,
      },
    ],
    institution: {
      id: "BANK_ALL_XXX",
      name: "Test Bank",
      bic: "TESTBIC",
      transaction_total_days: "90",
      countries: ["DE"],
      logo: "https://example.com/logo.png",
    },
  });

  expect(result.currency).toBe("XXX");
});

test("Transform account balance - XXX resolved from balances array", () => {
  expect(
    transformAccountBalance({
      balance: {
        currency: "XXX",
        amount: "1000.00",
      },
      balances: [
        {
          balanceType: "interimAvailable",
          balanceAmount: { amount: "1000.00", currency: "EUR" },
          creditLimitIncluded: false,
        },
      ],
      accountType: "depository",
    }),
  ).toEqual({
    currency: "EUR",
    amount: 1000,
    available_balance: 1000,
    credit_limit: null,
  });
});
