import { expect, test } from "bun:test";
import {
  transformAccount,
  transformBalance,
  transformTransaction,
} from "./transform";

test("Transform income transaction", () => {
  expect(
    transformTransaction({
      entry_reference: "rtrhrth",
      merchant_category_code: null,
      transaction_amount: { currency: "SEK", amount: "25000.000" },
      creditor: null,
      creditor_account: {
        iban: "SE1750000000050401007804",
        other: {
          identification: "50401007804",
          scheme_name: "BBAN",
          issuer: null,
        },
      },
      creditor_agent: {
        bic_fi: "ESSESESSXXX",
        clearing_system_member_id: null,
        name: null,
      },
      debtor: null,
      debtor_account: null,
      debtor_agent: null,
      bank_transaction_code: {
        description: "Other",
        code: null,
        sub_code: null,
      },
      credit_debit_indicator: "CRDT",
      status: "BOOK",
      booking_date: "2024-04-04",
      value_date: "2024-04-04",
      transaction_date: null,
      balance_after_transaction: { currency: "XXX", amount: "25000.000" },
      reference_number: null,
      remittance_information: ["ÖVERF. SALDO"],
      debtor_account_additional_identification: null,
      creditor_account_additional_identification: null,
      exchange_rate: null,
      note: null,
      transaction_id: null,
    }),
  ).toMatchSnapshot();
});

test("Transform expense transaction", () => {
  expect(
    transformTransaction({
      entry_reference: "rtrhrth",
      merchant_category_code: null,
      transaction_amount: { currency: "SEK", amount: "25000.000" },
      creditor: null,
      creditor_account: {
        iban: "SE1750000000050401007804",
        other: {
          identification: "50401007804",
          scheme_name: "BBAN",
          issuer: null,
        },
      },
      creditor_agent: {
        bic_fi: "ESSESESSXXX",
        clearing_system_member_id: null,
        name: null,
      },
      debtor: null,
      debtor_account: null,
      debtor_agent: null,
      bank_transaction_code: {
        description: "Other",
        code: null,
        sub_code: null,
      },
      credit_debit_indicator: "CRDT",
      status: "BOOK",
      booking_date: "2024-04-04",
      value_date: "2024-04-04",
      transaction_date: null,
      balance_after_transaction: { currency: "XXX", amount: "25000.000" },
      reference_number: null,
      remittance_information: ["ÖVERF. SALDO"],
      debtor_account_additional_identification: null,
      creditor_account_additional_identification: null,
      exchange_rate: null,
      note: null,
      transaction_id: null,
    }),
  ).toMatchSnapshot();
});

test("Transform account", () => {
  expect(
    transformAccount({
      account_id: { iban: "SE234234234" },
      all_account_ids: [],
      account_servicer: {
        bic_fi: "SEB",
        clearing_system_member_id: {
          clearing_system_id: "SEB",
          member_id: 1234567890,
        },
        name: "Example AB",
      },
      name: "Example AB",
      details: "Example AB",
      usage: "Example AB",
      cash_account_type: "CACC",
      product: "Enkla sparkontot företag",
      currency: "SEK",
      psu_status: "Authorized",
      credit_limit: { currency: "SEK", amount: "1000000" },
      postal_address: {
        address_type: "Example AB",
        department: "Example AB",
        sub_department: "Example AB",
        street_name: "Example AB",
        building_number: "Example AB",
        post_code: "Example AB",
        town_name: "Example AB",
        country_sub_division: "Example AB",
        country: "Example AB",
        address_line: ["Example AB"],
      },
      uid: "83435345-d61cb425f293",
      identification_hash: "3234.3GP8GRsZp9MO9sZwxoW/Fy+5rUBIsFLHcrXP8GZ/rv4=",
      identification_hashes: [
        "WwpbCiJhY2NvdW50IiwKImFjY291bnRfaWQiLAoiaWJhbiIKXQpd.KkjllfGbO16fy8adk4+6HI8PXQeZx7pBd+Fnir6svTU=",
      ],
      institution: { name: "SEB", country: "SE" },
      balance: {
        name: "",
        balance_amount: { currency: "SEK", amount: "90737.960" },
        balance_type: "ITAV",
        last_change_date_time: "2024-03-06",
        reference_date: "2024-03-06",
        last_committed_transaction: "1234567890",
      },
      legal_age: true,
      valid_until: "2024-03-06",
    }),
  ).toMatchSnapshot();
});

test("Transform account balance", () => {
  expect(
    transformBalance({
      name: "",
      balance_amount: { currency: "SEK", amount: "90737.960" },
      balance_type: "ITAV",
      last_change_date_time: "2024-03-06",
      reference_date: "2024-03-06",
      last_committed_transaction: "1234567890",
    }),
  ).toMatchSnapshot();
});
