import { describe, expect, test } from "bun:test";
import type { Transaction } from "plaid";
import {
  mapTransactionCategory,
  mapTransactionMethod,
  transformAccount,
  transformAccountBalance,
  transformInstitution,
  transformTransaction,
} from "./transform";

describe("Plaid Transform", () => {
  describe("mapTransactionMethod", () => {
    test("maps bill payment to payment", () => {
      expect(mapTransactionMethod("bill payment")).toBe("payment");
    });

    test("maps purchase to card_purchase", () => {
      expect(mapTransactionMethod("purchase")).toBe("card_purchase");
    });

    test("maps atm to card_atm", () => {
      expect(mapTransactionMethod("atm")).toBe("card_atm");
    });

    test("maps transfer to transfer", () => {
      expect(mapTransactionMethod("transfer")).toBe("transfer");
    });

    test("maps interest to interest", () => {
      expect(mapTransactionMethod("interest")).toBe("interest");
    });

    test("maps bank charge to fee", () => {
      expect(mapTransactionMethod("bank charge")).toBe("fee");
    });

    test("returns other for unknown types", () => {
      expect(mapTransactionMethod(null)).toBe("other");
      expect(mapTransactionMethod(undefined)).toBe("other");
    });
  });

  describe("mapTransactionCategory", () => {
    test("returns income for positive amount in depository account", () => {
      const result = mapTransactionCategory({
        transaction: {} as Transaction,
        amount: 100,
        accountType: "depository",
      });
      expect(result).toBe("income");
    });

    test("returns credit-card-payment for credit account payment", () => {
      const result = mapTransactionCategory({
        transaction: {
          personal_finance_category: {
            primary: "TRANSFER_IN",
            detailed: "",
            confidence_level: "HIGH",
          },
        } as Transaction,
        amount: 100,
        accountType: "credit",
      });
      expect(result).toBe("credit-card-payment");
    });

    test("returns fees for bank charge", () => {
      const result = mapTransactionCategory({
        transaction: {
          transaction_code: "bank charge",
        } as Transaction,
        amount: -25,
        accountType: "depository",
      });
      expect(result).toBe("fees");
    });

    test("returns meals for food and drink", () => {
      const result = mapTransactionCategory({
        transaction: {
          personal_finance_category: {
            primary: "FOOD_AND_DRINK",
            detailed: "",
            confidence_level: "HIGH",
          },
        } as Transaction,
        amount: -50,
        accountType: "depository",
      });
      expect(result).toBe("meals");
    });

    test("returns travel for transportation", () => {
      const result = mapTransactionCategory({
        transaction: {
          personal_finance_category: {
            primary: "TRANSPORTATION",
            detailed: "",
            confidence_level: "HIGH",
          },
        } as Transaction,
        amount: -100,
        accountType: "depository",
      });
      expect(result).toBe("travel");
    });
  });

  describe("transformTransaction", () => {
    test("transforms a basic transaction", () => {
      const transaction = {
        transaction_id: "txn_123",
        date: "2024-01-15",
        name: "COFFEE SHOP",
        amount: 5.5,
        iso_currency_code: "USD",
        pending: false,
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.id).toBe("txn_123");
      expect(result.date).toBe("2024-01-15");
      expect(result.name).toBe("COFFEE SHOP");
      expect(result.amount).toBe(-5.5); // Inverted
      expect(result.currency).toBe("USD");
      expect(result.status).toBe("posted");
    });

    test("transforms a pending transaction", () => {
      const transaction = {
        transaction_id: "txn_456",
        date: "2024-01-15",
        name: "PENDING CHARGE",
        amount: 10,
        iso_currency_code: "USD",
        pending: true,
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.status).toBe("pending");
    });
  });

  describe("transformAccount", () => {
    test("transforms a depository account", () => {
      const result = transformAccount({
        account_id: "acc_123",
        name: "Checking Account",
        balances: {
          available: 1000,
          current: 1050,
          iso_currency_code: "USD",
        },
        institution: {
          id: "ins_123",
          name: "Test Bank",
        },
        type: "depository",
        subtype: "checking",
        mask: "1234",
        persistent_account_id: "pers_123",
      });

      expect(result.id).toBe("acc_123");
      expect(result.name).toBe("Checking Account");
      expect(result.type).toBe("depository");
      expect(result.currency).toBe("USD");
      expect(result.institution.id).toBe("ins_123");
      expect(result.resource_id).toBe("pers_123");
    });

    test("transforms a credit account", () => {
      const result = transformAccount({
        account_id: "acc_456",
        name: "Credit Card",
        balances: {
          available: 4000,
          current: 1000,
          limit: 5000,
          iso_currency_code: "USD",
        },
        institution: {
          id: "ins_123",
          name: "Test Bank",
        },
        type: "credit",
        subtype: "credit card",
        mask: "5678",
      });

      expect(result.type).toBe("credit");
      expect(result.balance.amount).toBe(1000); // Current, not available
      expect(result.credit_limit).toBe(5000);
    });
  });

  describe("transformAccountBalance", () => {
    test("returns available balance for depository", () => {
      const result = transformAccountBalance({
        balances: {
          available: 1000,
          current: 1050,
          iso_currency_code: "USD",
        },
        accountType: "depository",
      });

      expect(result.amount).toBe(1000);
      expect(result.currency).toBe("USD");
    });

    test("returns current balance for credit", () => {
      const result = transformAccountBalance({
        balances: {
          available: 4000,
          current: 1000,
          limit: 5000,
          iso_currency_code: "USD",
        },
        accountType: "credit",
      });

      expect(result.amount).toBe(1000);
      expect(result.credit_limit).toBe(5000);
    });
  });

  describe("transformInstitution", () => {
    test("transforms an institution", () => {
      const result = transformInstitution({
        institution_id: "ins_123",
        name: "Test Bank",
      });

      expect(result.id).toBe("ins_123");
      expect(result.name).toBe("Test Bank");
      expect(result.provider).toBe("plaid");
    });
  });
});
