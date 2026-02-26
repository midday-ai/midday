import type { StateDisclosureConfig } from "../types";

// TODO: Review all legal text with legal counsel before production use

export const virginiaConfig: StateDisclosureConfig = {
  stateCode: "VA",
  stateName: "Virginia",
  lawName: "Commercial Financing Disclosure Law",
  lawReference: "Virginia Code § 6.2-2247 et seq.",
  effectiveDate: "2022-07-01",
  status: "active",
  version: "VA-2022-07-v1",

  maxFundingThreshold: 500_000,
  requiresRegistration: false,

  requiredFields: [
    "fundingAmount",
    "totalRepaymentAmount",
    "financeCharge",
    "annualPercentageRate",
    "paymentAmount",
    "paymentFrequency",
    "numberOfPayments",
    "prepaymentSavingsEstimate",
  ],

  disclosureTypes: ["mca"],

  legalText: {
    header:
      "COMMERCIAL FINANCING DISCLOSURE — COMMONWEALTH OF VIRGINIA\n" +
      "Pursuant to the Virginia Commercial Financing Disclosure Law",

    disclosureNotice:
      "This disclosure is provided pursuant to Virginia's Commercial Financing Disclosure Law " +
      "(Virginia Code § 6.2-2247 et seq.). The terms described below represent the commercial " +
      "financing transaction offered to you. Please review all terms carefully before signing.",

    prepaymentPolicy:
      "PREPAYMENT: The estimated prepayment savings shown assume a pro-rata reduction in the " +
      "finance charge if you prepay at the midpoint of the term. Actual savings depend on the " +
      "specific terms of your agreement. Refer to your merchant agreement for specific " +
      "prepayment terms and conditions.",

    collateralRequirements: null,
    personalGuarantee: null,
    rightOfRecission: null,

    additionalTerms: [
      "This is a purchase of future receivables, not a loan. The Annual Percentage Rate (APR) " +
      "is provided for comparison purposes as required by Virginia law.",
    ],
  },
};
