import { expect, test } from "bun:test";
import {
  transformAccount,
  transformAccountBalance,
  transformTransaction,
} from "./transform";

test("Transform income transaction", () => {
  expect(
    transformTransaction({
      transactionId:
        "8wwecA0PsWWCLPLazQzht2oOcxSIQ5UlWPHaNBpC3tjYtc002faJcjWzRpyO4sjz66kRpb7_5rA",
      entryReference: "5490990006",
      bookingDate: "2024-02-23",
      valueDate: "2024-02-23",
      transactionAmount: {
        amount: "-38000.00",
        currency: "SEK",
      },
      additionalInformation: "LÖN         160434262327",
      proprietaryBankTransactionCode: "Transfer",
      internalTransactionId: "86b1bc36e6a6d2a5dee8ff7138920255",
    }),
  ).toMatchSnapshot();
});

test("Transform accounts", () => {
  // Get the transformed account
  const transformedAccount = transformAccount({
    id: "b11e5627-cac8-41c9-a74a-2b88438fe07d",
    created: "2024-02-23T13:29:47.314568Z",
    last_accessed: "2024-03-06T16:34:16.782598Z",
    iban: "3133",
    institution_id: "PLEO_PLEODK00",
    status: "READY",
    owner_name: "",
    account: {
      resourceId: "3133",
      currency: "SEK",
      name: "Pleo Account",
      product: "Pleo",
      cashAccountType: "TRAN",
      iban: "123",
      ownerName: "Name",
    },
    balance: {
      currency: "SEK",
      amount: "1942682.86",
    },
    institution: {
      id: "PLEO_PLEODK00",
      name: "Pleo",
      bic: "PLEODK00",
      transaction_total_days: "90",
      countries: ["DK", "GB", "DE", "SE", "ES", "IE", "DK"],
      logo: "https://cdn-logos.gocardless.com/ais/PLEO_PLEODK00.png",
    },
  });

  // Create a stable version of the account for snapshot testing
  // by replacing the dynamic expires_at date with a fixed string
  const stableAccount = {
    ...transformedAccount,
    expires_at: "FIXED_DATE_FOR_TESTING",
  };

  expect(stableAccount).toMatchSnapshot();
});

test("Transform account balance", () => {
  expect(
    transformAccountBalance({
      currency: "SEK",
      amount: "1942682.86",
    }),
  ).toMatchSnapshot();
});
