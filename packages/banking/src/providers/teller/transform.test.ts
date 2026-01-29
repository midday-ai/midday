import { describe, expect, test } from "bun:test";
import {
  mapTransactionCategory,
  mapTransactionMethod,
  transformAccount,
  transformAccountBalance,
  transformDescription,
  transformInstitution,
  transformTransaction,
} from "./transform";
import type {
  Transaction,
  TransformAccount,
  TransformInstitution,
} from "./types";

describe("Teller Transform", () => {
  describe("mapTransactionMethod", () => {
    test("maps payment to payment", () => {
      expect(mapTransactionMethod("payment")).toBe("payment");
    });

    test("maps bill_payment to payment", () => {
      expect(mapTransactionMethod("bill_payment")).toBe("payment");
    });

    test("maps card_payment to card_purchase", () => {
      expect(mapTransactionMethod("card_payment")).toBe("card_purchase");
    });

    test("maps atm to card_atm", () => {
      expect(mapTransactionMethod("atm")).toBe("card_atm");
    });

    test("maps transfer to transfer", () => {
      expect(mapTransactionMethod("transfer")).toBe("transfer");
    });

    test("maps ach to ach", () => {
      expect(mapTransactionMethod("ach")).toBe("ach");
    });

    test("maps deposit to deposit", () => {
      expect(mapTransactionMethod("deposit")).toBe("deposit");
    });

    test("maps wire to wire", () => {
      expect(mapTransactionMethod("wire")).toBe("wire");
    });

    test("maps fee to fee", () => {
      expect(mapTransactionMethod("fee")).toBe("fee");
    });

    test("returns other for unknown types", () => {
      expect(mapTransactionMethod(undefined)).toBe("other");
      expect(mapTransactionMethod("unknown")).toBe("other");
    });
  });

  describe("mapTransactionCategory", () => {
    test("returns fees for fee type", () => {
      const result = mapTransactionCategory({
        transaction: { type: "fee", details: {} } as Transaction,
        amount: -25,
        accountType: "depository",
      });
      expect(result).toBe("fees");
    });

    test("returns income for positive amount in depository account", () => {
      const result = mapTransactionCategory({
        transaction: { type: "deposit", details: {} } as Transaction,
        amount: 100,
        accountType: "depository",
      });
      expect(result).toBe("income");
    });

    test("returns credit-card-payment for credit account payment", () => {
      const result = mapTransactionCategory({
        transaction: { type: "payment", details: {} } as Transaction,
        amount: 100,
        accountType: "credit",
      });
      expect(result).toBe("credit-card-payment");
    });

    test("returns meals for dining category", () => {
      const result = mapTransactionCategory({
        transaction: {
          type: "card_payment",
          details: { category: "dining" },
        } as Transaction,
        amount: -50,
        accountType: "depository",
      });
      expect(result).toBe("meals");
    });

    test("returns travel for transport category", () => {
      const result = mapTransactionCategory({
        transaction: {
          type: "card_payment",
          details: { category: "transport" },
        } as Transaction,
        amount: -30,
        accountType: "depository",
      });
      expect(result).toBe("travel");
    });

    test("returns software for software category", () => {
      const result = mapTransactionCategory({
        transaction: {
          type: "card_payment",
          details: { category: "software" },
        } as Transaction,
        amount: -99,
        accountType: "depository",
      });
      expect(result).toBe("software");
    });
  });

  describe("transformDescription", () => {
    test("returns counterparty name when different from description", () => {
      const result = transformDescription({
        description: "PURCHASE",
        details: {
          counterparty: { name: "MERCHANT NAME" },
        },
      } as Transaction);
      expect(result).toBe("Merchant Name");
    });

    test("returns null when counterparty name equals description after case transform", () => {
      // transformDescription compares capitalCase(counterparty.name) with description
      // So "Merchant Name" from capitalCase("MERCHANT NAME") should match "Merchant Name"
      const result = transformDescription({
        description: "Merchant Name",
        details: {
          counterparty: { name: "MERCHANT NAME" },
        },
      } as Transaction);
      expect(result).toBeNull();
    });
  });

  describe("transformTransaction", () => {
    test("transforms a depository transaction", () => {
      const transaction: Transaction = {
        id: "txn_123",
        date: "2024-01-15",
        description: "COFFEE SHOP",
        amount: "-5.50",
        type: "card_payment",
        status: "posted",
        details: {
          category: "dining",
          counterparty: { name: "Coffee Shop Inc" },
        },
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.id).toBe("txn_123");
      expect(result.date).toBe("2024-01-15");
      expect(result.name).toBe("Coffee Shop");
      expect(result.amount).toBe(-5.5);
      expect(result.currency).toBe("USD");
      expect(result.method).toBe("card_purchase");
      expect(result.status).toBe("posted");
    });

    test("transforms a credit transaction (inverts amount)", () => {
      const transaction: Transaction = {
        id: "txn_456",
        date: "2024-01-15",
        description: "PURCHASE",
        amount: "-100.00",
        type: "card_payment",
        status: "posted",
        details: {},
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "credit",
      });

      // Credit accounts: positive values when money moves out, negative when in
      // So -100 becomes +100 (expense on credit card)
      expect(result.amount).toBe(100);
    });

    test("transforms a pending transaction", () => {
      const transaction: Transaction = {
        id: "txn_789",
        date: "2024-01-15",
        description: "PENDING",
        amount: "-10.00",
        type: "card_payment",
        status: "pending",
        details: {},
      } as Transaction;

      const result = transformTransaction({
        transaction,
        accountType: "depository",
      });

      expect(result.status).toBe("pending");
    });
  });

  describe("transformAccount", () => {
    test("transforms a checking account", () => {
      const account: TransformAccount & { accountDetails?: any } = {
        id: "acc_123",
        name: "Checking Account",
        currency: "usd",
        enrollment_id: "enr_123",
        type: "depository",
        subtype: "checking",
        institution: {
          id: "chase",
          name: "Chase",
        },
        balance: { amount: "1000.00", currency: "usd" },
        last_four: "1234",
      };

      const result = transformAccount(account);

      expect(result.id).toBe("acc_123");
      expect(result.name).toBe("Checking Account");
      expect(result.type).toBe("depository");
      expect(result.currency).toBe("USD");
      expect(result.enrollment_id).toBe("enr_123");
      expect(result.resource_id).toBe("1234");
    });

    test("transforms a credit account", () => {
      const account: TransformAccount & { accountDetails?: any } = {
        id: "acc_456",
        name: "Credit Card",
        currency: "usd",
        enrollment_id: "enr_456",
        type: "credit",
        subtype: "credit_card",
        institution: {
          id: "chase",
          name: "Chase",
        },
        balance: { amount: "500.00", currency: "usd" },
        last_four: "5678",
      };

      const result = transformAccount(account);

      expect(result.type).toBe("credit");
    });

    test("includes account details when provided", () => {
      const account: TransformAccount & { accountDetails?: any } = {
        id: "acc_789",
        name: "Checking",
        currency: "usd",
        enrollment_id: "enr_789",
        type: "depository",
        subtype: "checking",
        institution: {
          id: "chase",
          name: "Chase",
        },
        balance: { amount: "1000.00", currency: "usd" },
        last_four: "9999",
        accountDetails: {
          account_number: "123456789",
          routing_numbers: {
            ach: "021000021",
            wire: "021000089",
            bacs: null,
          },
        },
      };

      const result = transformAccount(account);

      expect(result.routing_number).toBe("021000021");
      expect(result.wire_routing_number).toBe("021000089");
      expect(result.account_number).toBe("123456789");
    });
  });

  describe("transformAccountBalance", () => {
    test("returns balance amount", () => {
      const result = transformAccountBalance({
        balance: { amount: "1000.00", currency: "usd" },
        accountType: "depository",
      });

      expect(result.amount).toBe(1000);
      expect(result.currency).toBe("USD");
    });

    test("normalizes negative credit balance", () => {
      const result = transformAccountBalance({
        balance: { amount: "-500.00", currency: "usd" },
        accountType: "credit",
      });

      expect(result.amount).toBe(500);
    });

    test("includes available balance when provided", () => {
      const result = transformAccountBalance({
        balance: { amount: "1000.00", currency: "usd" },
        balances: { available: "950.00", ledger: "1000.00" },
        accountType: "depository",
      });

      expect(result.available_balance).toBe(950);
    });
  });

  describe("transformInstitution", () => {
    test("transforms an institution", () => {
      const institution: TransformInstitution = {
        id: "chase",
        name: "Chase",
      };

      const result = transformInstitution(institution);

      expect(result.id).toBe("chase");
      expect(result.name).toBe("Chase");
      expect(result.provider).toBe("teller");
    });
  });
});
