import { describe, expect, it } from "bun:test";
import {
  createTransactionKey,
  findDuplicateTransactions,
  mergeTransactions,
} from "./transaction-dedup";

describe("transaction-dedup", () => {
  describe("createTransactionKey", () => {
    it("should create consistent keys for transactions with number amounts", () => {
      const transaction = {
        booking_date: "2024-01-15",
        transaction_amount: -100.5,
      };

      const key = createTransactionKey(transaction);
      expect(key).toBe("2024-01-15-100.5-DBIT");
    });

    it("should create consistent keys for transactions with object amounts", () => {
      const transaction = {
        booking_date: "2024-01-15",
        transaction_amount: { amount: "100.50", currency: "USD" },
      };

      const key = createTransactionKey(transaction);
      expect(key).toBe("2024-01-15-100.5-CRDT");
    });

    it("should use value_date as fallback when booking_date is missing", () => {
      const transaction = {
        value_date: "2024-01-15",
        transaction_amount: 50.0,
      };

      const key = createTransactionKey(transaction);
      expect(key).toBe("2024-01-15-50-CRDT");
    });

    it("should handle negative and positive amounts correctly", () => {
      const debit = {
        booking_date: "2024-01-15",
        transaction_amount: -100,
      };
      const credit = {
        booking_date: "2024-01-15",
        transaction_amount: 100,
      };

      expect(createTransactionKey(debit)).toBe("2024-01-15-100-DBIT");
      expect(createTransactionKey(credit)).toBe("2024-01-15-100-CRDT");
    });
  });

  describe("mergeTransactions", () => {
    it("should merge transactions without duplicates", () => {
      const existing = [
        { booking_date: "2024-01-15", transaction_amount: -100, id: "1" },
        { booking_date: "2024-01-16", transaction_amount: -200, id: "2" },
      ];

      const newTxns = [
        { booking_date: "2024-01-15", transaction_amount: -100, id: "3" }, // duplicate
        { booking_date: "2024-01-17", transaction_amount: -300, id: "4" }, // new
      ];

      const merged = mergeTransactions(existing, newTxns);

      expect(merged).toHaveLength(3);
      expect(merged[0].id).toBe("1");
      expect(merged[1].id).toBe("2");
      expect(merged[2].id).toBe("4"); // Only the new unique transaction
    });

    it("should handle empty arrays", () => {
      const existing = [
        { booking_date: "2024-01-15", transaction_amount: -100 },
      ];

      expect(mergeTransactions(existing, [])).toEqual(existing);
      expect(mergeTransactions([], existing)).toEqual(existing);
    });
  });

  describe("findDuplicateTransactions", () => {
    it("should identify duplicate transactions", () => {
      const transactions = [
        { booking_date: "2024-01-15", transaction_amount: -100 },
        { booking_date: "2024-01-16", transaction_amount: -200 },
        { booking_date: "2024-01-15", transaction_amount: -100 }, // duplicate
        { booking_date: "2024-01-17", transaction_amount: -300 },
      ];

      const duplicates = findDuplicateTransactions(transactions);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toBe("2024-01-15-100-DBIT");
    });

    it("should return empty array when no duplicates", () => {
      const transactions = [
        { booking_date: "2024-01-15", transaction_amount: -100 },
        { booking_date: "2024-01-16", transaction_amount: -200 },
      ];

      const duplicates = findDuplicateTransactions(transactions);

      expect(duplicates).toHaveLength(0);
    });
  });
});
