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
    merchant_name: null,
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
    enrichment_completed: false,
    tax_amount: null,
    tax_rate: null,
    tax_type: null,
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
    counterpartyName: "Spotify AB",
    merchantName: null,
    internalId: "team123_123456",
    categorySlug: "meals",
    bankAccountId: "account456",
    balance: 100.5,
    teamId: "team123",
    status: "posted",
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
    merchant_name: null,
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
    enrichment_completed: false,
    tax_amount: null,
    tax_rate: null,
    tax_type: null,
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
    internalId: "team456_789012",
    categorySlug: null,
    counterpartyName: null,
    merchantName: null,
    bankAccountId: "account789",
    balance: null,
    teamId: "team456",
    status: "posted",
  });
});
