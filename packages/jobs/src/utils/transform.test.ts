import { expect, test } from "bun:test";
import { transformTransaction } from "./transform";

test("transformTransaction should correctly transform transaction data", () => {
  const mockTransaction = {
    id: "123456",
    name: "Coffee Shop",
    description: "Morning coffee",
    date: "2023-05-15",
    amount: 5.5,
    currency: "USD",
    method: "card",
    category: "meals",
    balance: 100.5,
    status: "posted" as "posted" | "pending",
  };

  const teamId = "team123";
  const bankAccountId = "account456";

  const result = transformTransaction({
    transaction: mockTransaction,
    teamId,
    bankAccountId,
  });

  expect(result).toEqual({
    name: "Coffee Shop",
    description: "Morning coffee",
    date: "2023-05-15",
    amount: 5.5,
    currency: "USD",
    method: "card",
    internal_id: "team123_123456",
    category_slug: "meals",
    bank_account_id: "account456",
    balance: 100.5,
    team_id: "team123",
    status: "posted",
  });
});

test("transformTransaction should handle null values correctly", () => {
  const mockTransaction = {
    id: "789012",
    name: "Unknown Transaction",
    description: null,
    date: "2023-05-16",
    amount: 10.0,
    currency: "EUR",
    method: null,
    category: null,
    balance: null,
    status: "pending" as "posted" | "pending",
  };

  const teamId = "team456";
  const bankAccountId = "account789";

  const result = transformTransaction({
    transaction: mockTransaction,
    teamId,
    bankAccountId,
  });

  expect(result).toEqual({
    name: "Unknown Transaction",
    description: null,
    date: "2023-05-16",
    amount: 10.0,
    currency: "EUR",
    method: null,
    internal_id: "team456_789012",
    category_slug: null,
    bank_account_id: "account789",
    balance: null,
    team_id: "team456",
    status: "pending",
  });
});
