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

test("Transform account balance", () => {
  expect(
    transformAccountBalance({
      available: 2000,
      current: 0,
      iso_currency_code: "USD",
      limit: null,
      unofficial_currency_code: null,
    }),
  ).toMatchSnapshot();
});
