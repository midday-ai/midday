import { expect, test } from "bun:test";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

test("Transform pending transaction", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        type: "check",
        status: "pending",
        running_balance: null,
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl2000",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl2000",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "BANK OF MANY",
          },
          category: "general",
        },
        description: "Online Check Deposit",
        date: "2024-03-05",
        amount: "-83.62",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card purchase transaction", () => {
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        type: "check",
        status: "pending",
        running_balance: null,
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl2000",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl2000",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "BANK OF MANY",
          },
          category: "general",
        },
        description: "Technology",
        date: "2024-03-05",
        amount: "29",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card payment received - should be credit-card-payment not income", () => {
  // When paying off a credit card, Teller reports negative amount (money coming IN to card)
  // This should NOT be categorized as income - it's a credit card payment
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        type: "payment",
        status: "posted",
        running_balance: "500.00",
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl3000",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl3000",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "BANK PAYMENT",
          },
          category: "general",
        },
        description: "Payment Thank You",
        date: "2024-03-05",
        amount: "-200.00",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card refund - should have no category", () => {
  // A refund on a credit card should not be auto-categorized
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        type: "card_payment", // refunds often come through as card_payment type
        status: "posted",
        running_balance: "500.00",
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl4000",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl4000",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "AMAZON REFUND",
          },
          category: "shopping",
        },
        description: "Amazon Refund",
        date: "2024-03-05",
        amount: "-50.00",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card cashback - should be income", () => {
  // Cashback/rewards marked as income by Teller should stay as income
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        type: "other",
        status: "posted",
        running_balance: "500.00",
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl5000",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl5000",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "REWARDS",
          },
          category: "income",
        },
        description: "Cash Back Rewards",
        date: "2024-03-05",
        amount: "-25.00",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform card payment transaction", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        type: "card_payment",
        status: "posted",
        running_balance: "83431.46",
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl2005",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl2005",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "NORDSTROM",
          },
          category: "shopping",
        },
        description: "Nordstrom",
        date: "2024-03-01",
        amount: "-68.90",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform income transaction", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        type: "card_payment",
        status: "posted",
        running_balance: "83296.40",
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl2002",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5u90e29shubl2002",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "organization",
            name: "EXXON MOBIL",
          },
          category: "fuel",
        },
        description: "Exxon Mobil",
        date: "2024-03-03",
        amount: "1000000",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform type transfer", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        type: "transfer",
        status: "posted",
        running_balance: "85897.25",
        links: {
          self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5ua0e29shubl2001",
          account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
        },
        id: "txn_os41r5ua0e29shubl2001",
        details: {
          processing_status: "complete",
          counterparty: {
            type: "person",
            name: "YOURSELF",
          },
          category: "general",
        },
        description: "Recurring Transfer to Savings",
        date: "2024-01-27",
        amount: "-37.99",
        account_id: "acc_os41qe3a66ks2djhss000",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform accounts", () => {
  expect(
    transformAccount({
      type: "credit",
      subtype: "credit_card",
      status: "open",
      name: "Platinum Card",
      links: {
        transactions:
          "https://api.teller.io/accounts/acc_os557c2mge29shubl2000/transactions",
        self: "https://api.teller.io/accounts/acc_os557c2mge29shubl2000",
        balances:
          "https://api.teller.io/accounts/acc_os557c2mge29shubl2000/balances",
      },
      last_four: "6587",
      institution: {
        name: "Mercury",
        id: "mercury",
      },
      balance: {
        currency: "USD",
        amount: 2011100,
        available_balance: null,
        credit_limit: null,
      },
      id: "acc_os557c2mge29shubl2000",
      enrollment_id: "enr_os557c8pck2deoskak000",
      currency: "USD",
    }),
  ).toMatchSnapshot();
});

test("Transform account balance - depository", () => {
  expect(
    transformAccountBalance({
      balance: {
        currency: "USD",
        amount: 2011100,
      },
      accountType: "depository",
    }),
  ).toMatchSnapshot();
});

test("Transform account balance - credit with positive (stays positive)", () => {
  // Teller returns positive values for credit card debt
  expect(
    transformAccountBalance({
      balance: {
        currency: "USD",
        amount: 150000,
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "USD",
    amount: 150000,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - credit with negative (normalized to positive)", () => {
  // Safety: if Teller ever returns negative credit balance, normalize it
  expect(
    transformAccountBalance({
      balance: {
        currency: "USD",
        amount: -150000,
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "USD",
    amount: 150000,
    available_balance: null,
    credit_limit: null,
  });
});
