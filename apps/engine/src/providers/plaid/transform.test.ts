import { expect, test } from "bun:test";
import {
  AccountSubtype,
  AccountType,
  CounterpartyType,
  TransactionCode,
  TransactionPaymentChannelEnum,
  TransactionTransactionTypeEnum,
} from "plaid";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

test("Transform pending transaction", () => {
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        account_id: "AG7EkLW7DRSVaN8Z75jMT1DJN51QpWc9LKB7w",
        account_owner: null,
        amount: 5.4,
        authorized_date: "2024-02-23",
        authorized_datetime: null,
        category: ["Travel", "Taxi"],
        category_id: "22016000",
        check_number: null,
        counterparties: [
          {
            confidence_level: "VERY_HIGH",
            entity_id: "eyg8o776k0QmNgVpAmaQj4WgzW9Qzo6O51gdd",
            logo_url: "https://plaid-merchant-logos.plaid.com/uber_1060.png",
            name: "Uber",
            type: CounterpartyType.Merchant,
            website: "uber.com",
          },
        ],
        date: "2024-02-24",
        datetime: null,
        iso_currency_code: "CAD",
        location: {
          address: null,
          city: null,
          country: null,
          lat: null,
          lon: null,
          postal_code: null,
          region: null,
          store_number: null,
        },
        logo_url: "https://plaid-merchant-logos.plaid.com/uber_1060.png",
        merchant_entity_id: "eyg8o776k0QmNgVpAmaQj4WgzW9Qzo6O51gdd",
        merchant_name: "Uber",
        name: "Uber 063015 SF**POOL**",
        payment_channel: TransactionPaymentChannelEnum.Online,
        payment_meta: {
          by_order_of: null,
          payee: null,
          payer: null,
          payment_method: null,
          payment_processor: null,
          ppd_id: null,
          reason: null,
          reference_number: null,
        },
        pending: true,
        pending_transaction_id: null,
        personal_finance_category: {
          confidence_level: "VERY_HIGH",
          detailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
          primary: "TRANSPORTATION",
        },
        personal_finance_category_icon_url:
          "https://plaid-category-icons.plaid.com/PFC_TRANSPORTATION.png",
        transaction_code: null,
        transaction_id: "NxkDjlyk45cQoDm5PEqJuKJaw6qrj9cy89zBA",
        transaction_type: TransactionTransactionTypeEnum.Special,
        unofficial_currency_code: null,
        website: "uber.com",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform income transaction", () => {
  expect(
    transformTransaction({
      accountType: "depository",
      transaction: {
        account_id: "AG7EkLW7DRSVaN8Z75jMT1DJN51QpWc9LKB7w",
        account_owner: null,
        amount: 1500,
        authorized_date: "2024-02-22",
        authorized_datetime: null,
        category: ["Travel", "Airlines and Aviation Services"],
        category_id: "22001000",
        check_number: null,
        counterparties: [
          {
            confidence_level: "VERY_HIGH",
            entity_id: "NKDjqyAdQQzpyeD8qpLnX0D6yvLe2KYKYYzQ4",
            logo_url:
              "https://plaid-merchant-logos.plaid.com/united_airlines_1065.png",
            name: "United Airlines",
            type: CounterpartyType.Merchant,
            website: "united.com",
          },
        ],
        date: "2024-02-22",
        datetime: null,
        iso_currency_code: "CAD",
        location: {
          address: null,
          city: null,
          country: null,
          lat: null,
          lon: null,
          postal_code: null,
          region: null,
          store_number: null,
        },
        logo_url:
          "https://plaid-merchant-logos.plaid.com/united_airlines_1065.png",
        merchant_entity_id: "NKDjqyAdQQzpyeD8qpLnX0D6yvLe2KYKYYzQ4",
        merchant_name: "United Airlines",
        name: "United Airlines",
        payment_channel: TransactionPaymentChannelEnum.InStore,
        payment_meta: {
          by_order_of: null,
          payee: null,
          payer: null,
          payment_method: null,
          payment_processor: null,
          ppd_id: null,
          reason: null,
          reference_number: null,
        },
        pending: false,
        pending_transaction_id: null,
        personal_finance_category: {
          confidence_level: "VERY_HIGH",
          detailed: "TRAVEL_FLIGHTS",
          primary: "TRAVEL",
        },
        personal_finance_category_icon_url:
          "https://plaid-category-icons.plaid.com/PFC_TRAVEL.png",
        transaction_code: null,
        transaction_id: "5QKmMdaKWgtzkvKEPmqriLZR1mV3kMF5X9EeX",
        transaction_type: TransactionTransactionTypeEnum.Special,
        unofficial_currency_code: null,
        website: "united.com",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform type transfer", () => {
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        account_id: "AG7EkLW7DRSVaN8Z75jMT1DJN51QpWc9LKB7w",
        account_owner: null,
        amount: 31.53,
        authorized_date: "2024-02-23",
        authorized_datetime: null,
        category: ["Travel", "Taxi"],
        category_id: "22016000",
        check_number: null,
        counterparties: [
          {
            confidence_level: "VERY_HIGH",
            entity_id: "eyg8o776k0QmNgVpAmaQj4WgzW9Qzo6O51gdd",
            logo_url: "https://plaid-merchant-logos.plaid.com/uber_1060.png",
            name: "Uber",
            type: CounterpartyType.Merchant,
            website: "uber.com",
          },
        ],
        date: "2024-02-24",
        datetime: null,
        iso_currency_code: "CAD",
        location: {
          address: null,
          city: null,
          country: null,
          lat: null,
          lon: null,
          postal_code: null,
          region: null,
          store_number: null,
        },
        logo_url: "https://plaid-merchant-logos.plaid.com/uber_1060.png",
        merchant_entity_id: "eyg8o776k0QmNgVpAmaQj4WgzW9Qzo6O51gdd",
        merchant_name: "Uber",
        name: "Uber 063015 SF**POOL**",
        payment_channel: TransactionPaymentChannelEnum.Online,
        payment_meta: {
          by_order_of: null,
          payee: null,
          payer: null,
          payment_method: null,
          payment_processor: null,
          ppd_id: null,
          reason: null,
          reference_number: null,
        },
        pending: true,
        pending_transaction_id: null,
        personal_finance_category: {
          confidence_level: "VERY_HIGH",
          detailed: "TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
          primary: "TRANSPORTATION",
        },
        personal_finance_category_icon_url:
          "https://plaid-category-icons.plaid.com/PFC_TRANSPORTATION.png",
        transaction_code: TransactionCode.Transfer,
        transaction_id: "NxkDjlyk45cQoDm5PEqJuKJaw6qrj9cy89zBA",
        transaction_type: TransactionTransactionTypeEnum.Special,
        unofficial_currency_code: null,
        website: "uber.com",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform accounts", () => {
  expect(
    transformAccount({
      account_id: "kKZWQnoZVqcBeN71qdyoh8mVoErgb7tL7gmBL",
      balances: {
        available: 56302.06,
        current: 56302.06,
        iso_currency_code: "CAD",
        limit: null,
        unofficial_currency_code: null,
      },
      mask: "8888",
      name: "Plaid Mortgage",
      official_name: null,
      subtype: AccountSubtype.Mortgage,
      type: AccountType.Loan,
      institution: {
        id: "ins_100546",
        name: "American Funds Retirement Solutions",
        logo: null,
      },
    }),
  ).toMatchSnapshot();
});

test("Transform account balance - depository uses available", () => {
  expect(
    transformAccountBalance({
      balances: {
        available: 2000,
        current: 1500,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      accountType: "depository",
    }),
  ).toMatchSnapshot();
});

test("Transform account balance - credit uses current (amount owed)", () => {
  // Credit card with $5000 limit, $1000 owed
  // available = $4000 (available credit), current = $1000 (debt)
  // We should show $1000 (current), not $4000 (available)
  expect(
    transformAccountBalance({
      balances: {
        available: 4000,
        current: 1000,
        iso_currency_code: "USD",
        limit: 5000,
        unofficial_currency_code: null,
      },
      accountType: "credit",
    }),
  ).toMatchSnapshot();
});

test("Transform account balance - depository falls back to current when available is null", () => {
  // Some accounts may not have available balance
  expect(
    transformAccountBalance({
      balances: {
        available: null,
        current: 5000,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      accountType: "depository",
    }),
  ).toEqual({
    currency: "USD",
    amount: 5000,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - handles null balances gracefully", () => {
  expect(
    transformAccountBalance({
      balances: {
        available: null,
        current: null,
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      accountType: "depository",
    }),
  ).toEqual({
    currency: "USD",
    amount: 0,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform account balance - credit card overpayment (negative current)", () => {
  // If someone overpays their credit card, Plaid shows negative current
  // This means they have a credit balance (bank owes them money)
  expect(
    transformAccountBalance({
      balances: {
        available: 5500, // Available credit PLUS overpayment
        current: -500, // Negative = overpaid by $500
        iso_currency_code: "USD",
        limit: 5000,
        unofficial_currency_code: null,
      },
      accountType: "credit",
    }),
  ).toEqual({
    currency: "USD",
    amount: -500, // Shows as negative (credit in customer's favor)
    available_balance: 5500,
    credit_limit: 5000,
  });
});

test("Transform account balance - loan account uses current", () => {
  // Loan accounts don't have available balance
  expect(
    transformAccountBalance({
      balances: {
        available: null,
        current: 75000, // Outstanding loan balance
        iso_currency_code: "USD",
        limit: null,
        unofficial_currency_code: null,
      },
      accountType: "loan",
    }),
  ).toEqual({
    currency: "USD",
    amount: 75000,
    available_balance: null,
    credit_limit: null,
  });
});

test("Transform credit card payment - should be credit-card-payment not income", () => {
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        account_id: "AG7EkLW7DRSVaN8Z75jMT1DJN51QpWc9LKB7w",
        account_owner: null,
        amount: -500, // Negative in Plaid = money IN to credit card
        authorized_date: "2024-02-23",
        authorized_datetime: null,
        category: ["Payment", "Credit Card"],
        category_id: "16001000",
        check_number: null,
        counterparties: [],
        date: "2024-02-24",
        datetime: null,
        iso_currency_code: "USD",
        location: {
          address: null,
          city: null,
          country: null,
          lat: null,
          lon: null,
          postal_code: null,
          region: null,
          store_number: null,
        },
        logo_url: null,
        merchant_entity_id: null,
        merchant_name: null,
        name: "Credit Card Payment",
        payment_channel: TransactionPaymentChannelEnum.Other,
        payment_meta: {
          by_order_of: null,
          payee: null,
          payer: null,
          payment_method: null,
          payment_processor: null,
          ppd_id: null,
          reason: null,
          reference_number: null,
        },
        pending: false,
        pending_transaction_id: null,
        personal_finance_category: {
          confidence_level: "VERY_HIGH",
          detailed: "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
          primary: "LOAN_PAYMENTS",
        },
        personal_finance_category_icon_url: undefined,
        transaction_code: TransactionCode.BillPayment,
        transaction_id: "payment123",
        transaction_type: TransactionTransactionTypeEnum.Special,
        unofficial_currency_code: null,
        website: null,
      },
    }),
  ).toMatchSnapshot();
});

test("Transform credit card refund - should have no category", () => {
  expect(
    transformTransaction({
      accountType: "credit",
      transaction: {
        account_id: "AG7EkLW7DRSVaN8Z75jMT1DJN51QpWc9LKB7w",
        account_owner: null,
        amount: -50, // Negative in Plaid = money IN (refund)
        authorized_date: "2024-02-23",
        authorized_datetime: null,
        category: ["Shops", "Computers and Electronics"],
        category_id: "19013000",
        check_number: null,
        counterparties: [
          {
            confidence_level: "VERY_HIGH",
            entity_id: "amazon123",
            logo_url: "https://plaid-merchant-logos.plaid.com/amazon.png",
            name: "Amazon",
            type: CounterpartyType.Merchant,
            website: "amazon.com",
          },
        ],
        date: "2024-02-24",
        datetime: null,
        iso_currency_code: "USD",
        location: {
          address: null,
          city: null,
          country: null,
          lat: null,
          lon: null,
          postal_code: null,
          region: null,
          store_number: null,
        },
        logo_url: "https://plaid-merchant-logos.plaid.com/amazon.png",
        merchant_entity_id: "amazon123",
        merchant_name: "Amazon",
        name: "Amazon Refund",
        payment_channel: TransactionPaymentChannelEnum.Online,
        payment_meta: {
          by_order_of: null,
          payee: null,
          payer: null,
          payment_method: null,
          payment_processor: null,
          ppd_id: null,
          reason: null,
          reference_number: null,
        },
        pending: false,
        pending_transaction_id: null,
        personal_finance_category: {
          confidence_level: "VERY_HIGH",
          detailed: "GENERAL_MERCHANDISE_ELECTRONICS",
          primary: "GENERAL_MERCHANDISE",
        },
        personal_finance_category_icon_url: undefined,
        transaction_code: null,
        transaction_id: "refund123",
        transaction_type: TransactionTransactionTypeEnum.Special,
        unofficial_currency_code: null,
        website: "amazon.com",
      },
    }),
  ).toMatchSnapshot();
});

test("Transform account - credit card with available_balance and credit_limit", () => {
  const result = transformAccount({
    account_id: "credit_123",
    balances: {
      available: 4000, // Available credit
      current: 1000, // Amount owed
      iso_currency_code: "USD",
      limit: 5000, // Credit limit
      unofficial_currency_code: null,
    },
    mask: "1234",
    name: "My Credit Card",
    official_name: "Chase Sapphire",
    subtype: AccountSubtype.CreditCard,
    type: AccountType.Credit,
    institution: {
      id: "ins_chase",
      name: "Chase",
      logo: null,
    },
  });

  expect(result.available_balance).toBe(4000);
  expect(result.credit_limit).toBe(5000);
  expect(result.balance.amount).toBe(1000); // Current balance (amount owed)
});

test("Transform account - depository with available_balance, no credit_limit", () => {
  const result = transformAccount({
    account_id: "checking_123",
    balances: {
      available: 5000,
      current: 5200, // Includes pending
      iso_currency_code: "USD",
      limit: null,
      unofficial_currency_code: null,
    },
    mask: "5678",
    name: "My Checking",
    official_name: "Chase Checking",
    subtype: AccountSubtype.Checking,
    type: AccountType.Depository,
    institution: {
      id: "ins_chase",
      name: "Chase",
      logo: null,
    },
  });

  expect(result.available_balance).toBe(5000);
  expect(result.credit_limit).toBeNull();
  expect(result.balance.amount).toBe(5000); // Depository uses available
});

test("Transform account - handles null balances gracefully", () => {
  const result = transformAccount({
    account_id: "savings_123",
    balances: {
      available: null,
      current: 10000,
      iso_currency_code: "USD",
      limit: null,
      unofficial_currency_code: null,
    },
    mask: "9999",
    name: "My Savings",
    official_name: null,
    subtype: AccountSubtype.Savings,
    type: AccountType.Depository,
    institution: {
      id: "ins_boa",
      name: "Bank of America",
      logo: null,
    },
  });

  expect(result.available_balance).toBeNull();
  expect(result.credit_limit).toBeNull();
});
