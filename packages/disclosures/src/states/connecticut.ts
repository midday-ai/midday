import type { StateDisclosureConfig } from "../types";

// TODO: Review all legal text with legal counsel before production use

export const connecticutConfig: StateDisclosureConfig = {
  stateCode: "CT",
  stateName: "Connecticut",
  lawName: "Small Business Truth-in-Lending Act (SB 1032)",
  lawReference: "Connecticut General Statutes § 36a-850 et seq.",
  effectiveDate: "2023-07-01",
  status: "active",
  version: "CT-2023-07-v1",

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
  ],

  disclosureTypes: ["mca"],

  legalText: {
    header:
      "COMMERCIAL FINANCING DISCLOSURE — STATE OF CONNECTICUT\n" +
      "Pursuant to the Connecticut Small Business Truth-in-Lending Act (SB 1032)",

    disclosureNotice:
      "This disclosure is provided pursuant to Connecticut's Small Business Truth-in-Lending Act " +
      "(SB 1032, codified at Conn. Gen. Stat. § 36a-850 et seq.). The terms described below " +
      "represent the commercial financing transaction offered to you. Please review all terms " +
      "carefully before signing.",

    prepaymentPolicy:
      "PREPAYMENT: Refer to your merchant agreement for specific prepayment terms and conditions.",

    collateralRequirements: null,
    personalGuarantee: null,
    rightOfRecission: null,

    additionalTerms: [
      "This is a purchase of future receivables, not a loan. The Annual Percentage Rate (APR) " +
      "is provided for comparison purposes as required by Connecticut law.",
    ],
  },
};
