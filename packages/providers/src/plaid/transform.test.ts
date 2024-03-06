import { expect, test } from "bun:test";
import { transformTransaction } from "./transform";

test("Transform pending transaction", () => {
  expect(
    transformTransaction({
      bankAccountId: "123",
      teamId: "123",
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
            phone_number: null,
            type: "merchant",
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
        payment_channel: "online",
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
        transaction_type: "special",
        unofficial_currency_code: null,
        website: "uber.com",
      },
    })
  ).toMatchSnapshot();
});

// test("Transform card payment transaction", () => {
//   expect(
//     transformTransaction({
//       bankAccountId: "123",
//       teamId: "123",
//       transaction: {
//         type: "card_payment",
//         status: "posted",
//         running_balance: "83431.46",
//         links: {
//           self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl2005",
//           account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
//         },
//         id: "txn_os41r5u90e29shubl2005",
//         details: {
//           processing_status: "complete",
//           counterparty: {
//             type: "organization",
//             name: "NORDSTROM",
//           },
//           category: "shopping",
//         },
//         description: "Nordstrom",
//         date: "2024-03-01",
//         amount: "-68.90",
//         account_id: "acc_os41qe3a66ks2djhss000",
//       },
//     })
//   ).toMatchSnapshot();
// });

// test("Transform income transaction", () => {
//   expect(
//     transformTransaction({
//       bankAccountId: "123",
//       teamId: "123",
//       transaction: {
//         type: "card_payment",
//         status: "posted",
//         running_balance: "83296.40",
//         links: {
//           self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5u90e29shubl2002",
//           account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
//         },
//         id: "txn_os41r5u90e29shubl2002",
//         details: {
//           processing_status: "complete",
//           counterparty: {
//             type: "organization",
//             name: "EXXON MOBIL",
//           },
//           category: "fuel",
//         },
//         description: "Exxon Mobil",
//         date: "2024-03-03",
//         amount: "-20.21",
//         account_id: "acc_os41qe3a66ks2djhss000",
//       },
//     })
//   ).toMatchSnapshot();
// });

// test("Transform type transfer", () => {
//   expect(
//     transformTransaction({
//       bankAccountId: "123",
//       teamId: "123",
//       transaction: {
//         type: "transfer",
//         status: "posted",
//         running_balance: "85897.25",
//         links: {
//           self: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000/transactions/txn_os41r5ua0e29shubl2001",
//           account: "https://api.teller.io/accounts/acc_os41qe3a66ks2djhss000",
//         },
//         id: "txn_os41r5ua0e29shubl2001",
//         details: {
//           processing_status: "complete",
//           counterparty: {
//             type: "person",
//             name: "YOURSELF",
//           },
//           category: "general",
//         },
//         description: "Recurring Transfer to Savings",
//         date: "2024-01-27",
//         amount: "-37.99",
//         account_id: "acc_os41qe3a66ks2djhss000",
//       },
//     })
//   ).toMatchSnapshot();
// });
