import { expect, test } from "bun:test";

const transformedSnapshot = {
  date: "2024-03-04",
  name: "Cash Deposit",
  method: "deposit",
  internal_id: "123_txn_os41r5u90e29shubl2001",
  amount: "57.43",
  currency: "USD",
  bank_account_id: "a87e60b9-8323-4bab-8dc9-4ac9786b48a6",
  category: "income",
  team_id: "123",
  balance: "83353.83",
  status: "posted",
};

test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});
