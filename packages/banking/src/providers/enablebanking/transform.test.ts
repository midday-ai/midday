import { describe, expect, test } from "bun:test";
import {
  hashInstitutionId,
  transformAccount,
  transformBalance,
  transformConnectionStatus,
  transformInstitution,
  transformTransaction,
  transformTransactionCategory,
  transformTransactionMethod,
  transformTransactionName,
} from "./transform";
import type {
  GetAccountDetailsResponse,
  GetTransaction,
  Institution,
} from "./types";

describe("EnableBanking Transform", () => {
  describe("hashInstitutionId", () => {
    test("creates consistent hash for institution", () => {
      const hash1 = hashInstitutionId("Test Bank", "SE");
      const hash2 = hashInstitutionId("Test Bank", "SE");
      expect(hash1).toBe(hash2);
    });

    test("creates different hashes for different countries", () => {
      const hashSE = hashInstitutionId("Test Bank", "SE");
      const hashNO = hashInstitutionId("Test Bank", "NO");
      expect(hashSE).not.toBe(hashNO);
    });

    test("returns 12 character hash", () => {
      const hash = hashInstitutionId("Test Bank", "SE");
      expect(hash.length).toBe(12);
    });
  });

  describe("transformInstitution", () => {
    test("transforms an institution", () => {
      const institution: Institution = {
        name: "Swedish Bank",
        country: "SE",
      };

      const result = transformInstitution(institution);

      expect(result.name).toBe("Swedish Bank");
      expect(result.provider).toBe("enablebanking");
      expect(result.id).toBe(hashInstitutionId("Swedish Bank", "SE"));
    });
  });

  describe("transformTransactionName", () => {
    test("uses remittance information when available", () => {
      const transaction: GetTransaction = {
        remittance_information: ["Payment for services"],
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "DBIT",
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionName(transaction);
      expect(result).toBe("Payment for services");
    });

    test("uses debtor name for credit transactions", () => {
      const transaction: GetTransaction = {
        remittance_information: [],
        debtor: { name: "John Doe" },
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "CRDT",
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionName(transaction);
      expect(result).toBe("John Doe");
    });

    test("uses creditor name for debit transactions", () => {
      const transaction: GetTransaction = {
        remittance_information: [],
        creditor: { name: "Merchant" },
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "DBIT",
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionName(transaction);
      expect(result).toBe("Merchant");
    });

    test("falls back to bank transaction code description", () => {
      const transaction: GetTransaction = {
        remittance_information: [],
        bank_transaction_code: { description: "Transfer" },
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "DBIT",
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionName(transaction);
      expect(result).toBe("Transfer");
    });
  });

  describe("transformTransactionCategory", () => {
    test("returns income for credit transaction in depository account", () => {
      const transaction: GetTransaction = {
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "CRDT",
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionCategory({
        transaction,
        accountType: "depository",
      });

      expect(result).toBe("income");
    });

    test("returns credit-card-payment for credit account payment", () => {
      const transaction: GetTransaction = {
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "CRDT",
        bank_transaction_code: { description: "Payment" },
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionCategory({
        transaction,
        accountType: "credit",
      });

      expect(result).toBe("credit-card-payment");
    });

    test("returns null for debit transactions", () => {
      const transaction: GetTransaction = {
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "DBIT",
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionCategory({
        transaction,
        accountType: "depository",
      });

      expect(result).toBeNull();
    });
  });

  describe("transformTransactionMethod", () => {
    test("returns payment for credit transactions", () => {
      const transaction: GetTransaction = {
        credit_debit_indicator: "CRDT",
        transaction_amount: { amount: "100", currency: "SEK" },
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionMethod(transaction);
      expect(result).toBe("payment");
    });

    test("returns transfer for Transfer description", () => {
      const transaction: GetTransaction = {
        credit_debit_indicator: "DBIT",
        bank_transaction_code: { description: "Transfer" },
        transaction_amount: { amount: "100", currency: "SEK" },
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionMethod(transaction);
      expect(result).toBe("transfer");
    });

    test("returns other for unknown types", () => {
      const transaction: GetTransaction = {
        credit_debit_indicator: "DBIT",
        transaction_amount: { amount: "100", currency: "SEK" },
        booking_date: "2024-01-15",
      } as GetTransaction;

      const result = transformTransactionMethod(transaction);
      expect(result).toBe("other");
    });
  });

  describe("transformTransaction", () => {
    test("transforms a credit transaction", () => {
      const transaction: GetTransaction = {
        entry_reference: "txn_123",
        booking_date: "2024-01-15",
        remittance_information: ["Salary payment"],
        transaction_amount: { amount: "5000", currency: "SEK" },
        credit_debit_indicator: "CRDT",
        debtor: { name: "Employer Inc" },
      } as GetTransaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.id).toBe("txn_123");
      expect(result.date).toBe("2024-01-15");
      expect(result.name).toBe("Salary Payment");
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe("SEK");
      expect(result.category).toBe("income");
    });

    test("transforms a debit transaction", () => {
      const transaction: GetTransaction = {
        entry_reference: "txn_456",
        booking_date: "2024-01-15",
        remittance_information: ["Coffee shop"],
        transaction_amount: { amount: "50", currency: "SEK" },
        credit_debit_indicator: "DBIT",
        creditor: { name: "Cafe AB" },
      } as GetTransaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.amount).toBe(-50);
      expect(result.method).toBe("other");
    });

    test("generates stable ID when entry_reference is missing", () => {
      const transaction: GetTransaction = {
        booking_date: "2024-01-15",
        value_date: "2024-01-15",
        remittance_information: ["Payment"],
        transaction_amount: { amount: "100", currency: "SEK" },
        credit_debit_indicator: "DBIT",
      } as GetTransaction;

      const result1 = transformTransaction({
        transaction,
        accountType: "depository",
      });
      const result2 = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result1.id).toBe(result2.id);
      expect(result1.id.length).toBe(32); // MD5 hash
    });
  });

  describe("transformAccount", () => {
    test("transforms a depository account", () => {
      const account: GetAccountDetailsResponse = {
        uid: "acc_123",
        product: "Current Account",
        currency: "SEK",
        cash_account_type: "CACC",
        balance: {
          balance_amount: { amount: "10000", currency: "SEK" },
          balance_type: "interimBooked",
        },
        institution: {
          name: "Swedish Bank",
          country: "SE",
        },
        identification_hash: "hash_123",
        valid_until: "2024-06-15T00:00:00Z",
        account_id: { iban: "SE3550000000054910000003" },
      } as GetAccountDetailsResponse;

      const result = transformAccount(account);

      expect(result.id).toBe("acc_123");
      expect(result.name).toBe("Current Account");
      expect(result.type).toBe("depository");
      expect(result.currency).toBe("SEK");
      expect(result.iban).toBe("SE3550000000054910000003");
      expect(result.resource_id).toBe("hash_123");
    });

    test("transforms a credit account", () => {
      const account: GetAccountDetailsResponse = {
        uid: "acc_456",
        product: "Credit Card",
        currency: "SEK",
        cash_account_type: "CARD",
        balance: {
          balance_amount: { amount: "5000", currency: "SEK" },
          balance_type: "interimBooked",
        },
        institution: {
          name: "Swedish Bank",
          country: "SE",
        },
        identification_hash: "hash_456",
        valid_until: "2024-06-15T00:00:00Z",
        credit_limit: { amount: "20000", currency: "SEK" },
      } as GetAccountDetailsResponse;

      const result = transformAccount(account);

      expect(result.type).toBe("credit");
      expect(result.credit_limit).toBe(20000);
    });
  });

  describe("transformBalance", () => {
    test("transforms balance for depository account", () => {
      const result = transformBalance({
        balance: {
          balance_amount: { amount: "10000", currency: "SEK" },
          balance_type: "interimBooked",
        },
        accountType: "depository",
      });

      expect(result.amount).toBe(10000);
      expect(result.currency).toBe("SEK");
    });

    test("normalizes negative credit balance", () => {
      const result = transformBalance({
        balance: {
          balance_amount: { amount: "-5000", currency: "SEK" },
          balance_type: "interimBooked",
        },
        accountType: "credit",
      });

      expect(result.amount).toBe(5000);
    });

    test("extracts available balance from available balance type", () => {
      const result = transformBalance({
        balance: {
          balance_amount: { amount: "9500", currency: "SEK" },
          balance_type: "interimAvailable",
        },
        accountType: "depository",
      });

      expect(result.available_balance).toBe(9500);
    });

    test("includes credit limit when provided", () => {
      const result = transformBalance({
        balance: {
          balance_amount: { amount: "5000", currency: "SEK" },
          balance_type: "interimBooked",
        },
        creditLimit: { amount: "20000", currency: "SEK" },
        accountType: "credit",
      });

      expect(result.credit_limit).toBe(20000);
    });
  });

  describe("transformConnectionStatus", () => {
    test("returns connected for AUTHORIZED status", () => {
      const result = transformConnectionStatus({
        status: "AUTHORIZED",
      } as any);

      expect(result.status).toBe("connected");
    });

    test("returns disconnected for other statuses", () => {
      const result = transformConnectionStatus({
        status: "EXPIRED",
      } as any);

      expect(result.status).toBe("disconnected");
    });
  });
});
