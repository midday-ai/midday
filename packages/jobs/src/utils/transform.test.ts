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
    method: "card_purchase" as
      | "transfer"
      | "other"
      | "unknown"
      | "payment"
      | "card_purchase"
      | "card_atm"
      | "ach"
      | "interest"
      | "deposit"
      | "wire"
      | "fee",
    category: "meals" as const,
    balance: 100.5,
    status: "posted" as const,
    internal_id: "test_123456",
    team_id: "team123",
    assigned_id: null,
    bank_account_id: null,
    counterparty_name: "Spotify AB",
    base_amount: null,
    base_currency: null,
    category_slug: null,
    created_at: "2023-05-15",
    frequency: null,
    fts_vector: null,
    internal: null,
    manual: null,
    note: null,
    notified: null,
    recurring: null,
    is_fulfilled: null,
    amount_text: null,
    calculated_vat: null,
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
    method: "card_purchase",
    counterparty_name: "Spotify AB",
    internal_id: "team123_123456",
    category_slug: "meals",
    bank_account_id: "account456",
    balance: 100.5,
    team_id: "team123",
    status: "posted",
    tax_rate: null,
    tax_type: null,
  });
});

test("transformTransaction should handle null values correctly", () => {
  const mockTransaction2 = {
    id: "789012",
    name: "Unknown Transaction",
    description: null,
    date: "2023-05-16",
    amount: 10.0,
    currency: "EUR",
    method: "unknown" as
      | "transfer"
      | "other"
      | "unknown"
      | "payment"
      | "card_purchase"
      | "card_atm"
      | "ach"
      | "interest"
      | "deposit"
      | "wire"
      | "fee",
    category: null,
    balance: null,
    status: "posted" as const,
    internal_id: "test_789012",
    team_id: "team456",
    assigned_id: null,
    bank_account_id: null,
    base_amount: null,
    base_currency: null,
    counterparty_name: null,
    category_slug: null,
    created_at: "2023-05-16",
    frequency: null,
    fts_vector: null,
    internal: null,
    manual: null,
    note: null,
    notified: null,
    recurring: null,
    is_fulfilled: null,
    amount_text: null,
    calculated_vat: null,
  };

  const teamId = "team456";
  const bankAccountId = "account789";

  const result = transformTransaction({
    transaction: mockTransaction2,
    teamId,
    bankAccountId,
  });

  expect(result).toEqual({
    name: "Unknown Transaction",
    description: null,
    date: "2023-05-16",
    amount: 10.0,
    currency: "EUR",
    method: "unknown",
    internal_id: "team456_789012",
    category_slug: null,
    counterparty_name: null,
    bank_account_id: "account789",
    balance: null,
    team_id: "team456",
    status: "posted",
    tax_rate: null,
    tax_type: null,
  });
});
