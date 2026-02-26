import type { StateDisclosureConfig } from "../types";

// TODO: Review all legal text with legal counsel before production use

export const utahConfig: StateDisclosureConfig = {
  stateCode: "UT",
  stateName: "Utah",
  lawName: "Commercial Financing Registration and Disclosure Act",
  lawReference: "Utah Code § 7-27-101 et seq.",
  effectiveDate: "2023-01-01",
  status: "active",
  version: "UT-2023-01-v1",

  maxFundingThreshold: 1_000_000,
  requiresRegistration: true,

  requiredFields: [
    "fundingAmount",
    "totalRepaymentAmount",
    "financeCharge",
    "annualPercentageRate",
    "paymentAmount",
    "paymentFrequency",
    "numberOfPayments",
  ],

  disclosureTypes: ["mca"],

  legalText: {
    header:
      "COMMERCIAL FINANCING DISCLOSURE — STATE OF UTAH\n" +
      "Pursuant to the Utah Commercial Financing Registration and Disclosure Act",

    disclosureNotice:
      "This disclosure is provided pursuant to Utah's Commercial Financing Registration and " +
      "Disclosure Act (Utah Code § 7-27-101 et seq.). The financing provider is registered " +
      "with the Utah Department of Financial Institutions as required by law. " +
      "The terms described below represent the commercial financing transaction offered to you.",

    prepaymentPolicy:
      "PREPAYMENT: Refer to your merchant agreement for specific prepayment terms and conditions.",

    collateralRequirements: null,
    personalGuarantee: null,
    rightOfRecission: null,

    additionalTerms: [
      "This is a purchase of future receivables, not a loan. The Annual Percentage Rate (APR) " +
      "is provided for comparison purposes as required by Utah law.",
      "The financing provider is required to be registered with the Utah Department of Financial " +
      "Institutions. You may verify registration at https://securities.utah.gov.",
    ],
  },
};
