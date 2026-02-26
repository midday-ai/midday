import type { StateDisclosureConfig } from "../types";

// TODO: Review all legal text with legal counsel before production use

export const newYorkConfig: StateDisclosureConfig = {
  stateCode: "NY",
  stateName: "New York",
  lawName: "Commercial Finance Disclosure Law",
  lawReference: "NY Financial Services Law Article 8 (23 NYCRR Part 600)",
  effectiveDate: "2023-08-01",
  status: "active",
  version: "NY-2023-08-v1",

  maxFundingThreshold: 2_500_000,
  requiresRegistration: false,

  requiredFields: [
    "fundingAmount",
    "totalRepaymentAmount",
    "financeCharge",
    "annualPercentageRate",
    "paymentAmount",
    "paymentFrequency",
    "numberOfPayments",
    "termLengthDays",
    "centsOnDollar",
    "prepaymentSavingsEstimate",
  ],

  disclosureTypes: ["mca"],

  legalText: {
    header:
      "COMMERCIAL FINANCING DISCLOSURE — STATE OF NEW YORK\n" +
      "Pursuant to the New York Department of Financial Services Commercial Finance Disclosure Law",

    disclosureNotice:
      "This disclosure is provided pursuant to the New York Commercial Finance Disclosure Law " +
      "(NY Financial Services Law Article 8) and regulations promulgated thereunder (23 NYCRR Part 600). " +
      "The terms described below represent the commercial financing transaction offered to you. " +
      "Please review all terms carefully before signing.",

    prepaymentPolicy:
      "PREPAYMENT: If you pay off this financing before the end of the term, you may be required " +
      "to pay the full purchase price (total repayment amount) regardless of when you pay. " +
      "The estimated prepayment savings shown above assume a pro-rata reduction in the finance charge, " +
      "which may not reflect the actual terms of your agreement. Refer to your merchant agreement " +
      "for specific prepayment terms and conditions.",

    collateralRequirements:
      "COLLATERAL: This transaction may require you to pledge business assets as collateral. " +
      "If you default, the financing provider may seize pledged collateral to recover amounts owed.",

    personalGuarantee:
      "PERSONAL GUARANTEE: This transaction may require a personal guarantee. If the business " +
      "fails to make required payments, you may be personally liable for the outstanding balance.",

    rightOfRecission: null,

    additionalTerms: [
      "This is a purchase of future receivables, not a loan. The Annual Percentage Rate (APR) " +
      "is provided for comparison purposes as required by New York law.",
      "The APR is calculated using the actuarial method as specified by the New York Department " +
      "of Financial Services.",
    ],
  },
};
