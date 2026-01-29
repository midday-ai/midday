import { describe, expect, test } from "bun:test";
import {
  mapTransactionCategory,
  mapTransactionMethod,
  transformAccount,
  transformAccountBalance,
  transformConnectionStatus,
  transformInstitution,
  transformTransaction,
  transformTransactionName,
} from "./transform";
import type { Transaction, TransformAccount } from "./types";

describe("GoCardless Transform", () => {
  describe("mapTransactionMethod", () => {
    test("maps Payment to payment", () => {
      expect(mapTransactionMethod("Payment")).toBe("payment");
    });

    test("maps Bankgiro payment to payment", () => {
      expect(mapTransactionMethod("Bankgiro payment")).toBe("payment");
    });

    test("maps Card purchase to card_purchase", () => {
      expect(mapTransactionMethod("Card purchase")).toBe("card_purchase");
    });

    test("maps Card ATM to card_atm", () => {
      expect(mapTransactionMethod("Card ATM")).toBe("card_atm");
    });

    test("maps Transfer to transfer", () => {
      expect(mapTransactionMethod("Transfer")).toBe("transfer");
    });

    test("returns other for unknown types", () => {
      expect(mapTransactionMethod(undefined)).toBe("other");
      expect(mapTransactionMethod("unknown")).toBe("other");
    });
  });

  describe("mapTransactionCategory", () => {
    test("returns income for positive amount in depository account", () => {
      const result = mapTransactionCategory({
        transaction: {
          transactionAmount: { amount: "100", currency: "EUR" },
        } as Transaction,
        accountType: "depository",
      });
      expect(result).toBe("income");
    });

    test("returns credit-card-payment for credit account payment", () => {
      const result = mapTransactionCategory({
        transaction: {
          transactionAmount: { amount: "100", currency: "EUR" },
          proprietaryBankTransactionCode: "Payment",
        } as Transaction,
        accountType: "credit",
      });
      expect(result).toBe("credit-card-payment");
    });

    test("returns null for negative amounts without specific category", () => {
      const result = mapTransactionCategory({
        transaction: {
          transactionAmount: { amount: "-50", currency: "EUR" },
        } as Transaction,
        accountType: "depository",
      });
      expect(result).toBeNull();
    });
  });

  describe("transformTransactionName", () => {
    test("uses creditorName when available", () => {
      const result = transformTransactionName({
        creditorName: "MERCHANT NAME",
      } as Transaction);
      expect(result).toBe("Merchant Name");
    });

    test("uses debtorName when creditorName is not available", () => {
      const result = transformTransactionName({
        debtorName: "SENDER NAME",
      } as Transaction);
      expect(result).toBe("Sender Name");
    });

    test("uses additionalInformation as fallback", () => {
      const result = transformTransactionName({
        additionalInformation: "SOME INFO",
      } as Transaction);
      expect(result).toBe("Some Info");
    });

    test("uses remittanceInformationUnstructuredArray as last resort", () => {
      const result = transformTransactionName({
        remittanceInformationUnstructuredArray: ["PAYMENT REFERENCE"],
      } as Transaction);
      expect(result).toBe("Payment Reference");
    });
  });

  describe("transformTransaction", () => {
    test("transforms a basic transaction", () => {
      const transaction: Transaction = {
        internalTransactionId: "txn_123",
        bookingDate: "2024-01-15",
        creditorName: "COFFEE SHOP",
        transactionAmount: { amount: "-5.50", currency: "EUR" },
        proprietaryBankTransactionCode: "Card purchase",
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.id).toBe("txn_123");
      expect(result.date).toBe("2024-01-15");
      expect(result.name).toBe("Coffee Shop");
      expect(result.amount).toBe(-5.5);
      expect(result.currency).toBe("EUR");
      expect(result.method).toBe("card_purchase");
    });

    test("handles currency exchange", () => {
      const transaction: Transaction = {
        internalTransactionId: "txn_456",
        bookingDate: "2024-01-15",
        creditorName: "FOREIGN MERCHANT",
        transactionAmount: { amount: "-100", currency: "EUR" },
        currencyExchange: [{ exchangeRate: "1.10", sourceCurrency: "USD" }],
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.currency_rate).toBe(1.1);
      expect(result.currency_source).toBe("USD");
    });
  });

  describe("transformAccount", () => {
    test("transforms a depository account", () => {
      const accountData: TransformAccount = {
        id: "acc_123",
        account: {
          iban: "DE89370400440532013000",
          currency: "eur",
          name: "Current Account",
          resourceId: "res_123",
          cashAccountType: "CACC",
        },
        balance: { amount: "1000.00", currency: "EUR" },
        balances: [],
        institution: {
          id: "BANK_DE",
          name: "German Bank",
          logo: "https://example.com/logo.png",
        },
      };

      const result = transformAccount(accountData);

      expect(result.id).toBe("acc_123");
      expect(result.name).toBe("Current Account");
      expect(result.type).toBe("depository");
      expect(result.currency).toBe("EUR");
      expect(result.iban).toBe("DE89370400440532013000");
    });

    test("transforms a credit account", () => {
      const accountData: TransformAccount = {
        id: "acc_456",
        account: {
          currency: "eur",
          name: "Credit Card",
          resourceId: "res_456",
          cashAccountType: "CARD",
        },
        balance: { amount: "-500.00", currency: "EUR" },
        balances: [],
        institution: {
          id: "BANK_DE",
          name: "German Bank",
          logo: "https://example.com/logo.png",
        },
      };

      const result = transformAccount(accountData);

      expect(result.type).toBe("credit");
    });
  });

  describe("transformAccountBalance", () => {
    test("returns balance for depository", () => {
      const result = transformAccountBalance({
        balance: { amount: "1000.00", currency: "EUR" },
        accountType: "depository",
      });

      expect(result.amount).toBe(1000);
      expect(result.currency).toBe("EUR");
    });

    test("normalizes negative credit balance to positive", () => {
      const result = transformAccountBalance({
        balance: { amount: "-500.00", currency: "EUR" },
        accountType: "credit",
      });

      expect(result.amount).toBe(500);
    });
  });

  describe("transformInstitution", () => {
    test("transforms an institution", () => {
      const result = transformInstitution({
        id: "BANK_DE",
        name: "German Bank",
        logo: "https://example.com/logo.png",
      });

      expect(result.id).toBe("BANK_DE");
      expect(result.name).toBe("German Bank");
      expect(result.provider).toBe("gocardless");
    });
  });

  describe("transformConnectionStatus", () => {
    test("returns connected for linked status", () => {
      const result = transformConnectionStatus({
        status: "LN",
      } as any);

      expect(result.status).toBe("connected");
    });

    test("returns disconnected for expired status", () => {
      const result = transformConnectionStatus({
        status: "EX",
      } as any);

      expect(result.status).toBe("disconnected");
    });

    test("returns disconnected for rejected status", () => {
      const result = transformConnectionStatus({
        status: "RJ",
      } as any);

      expect(result.status).toBe("disconnected");
    });
  });
});
