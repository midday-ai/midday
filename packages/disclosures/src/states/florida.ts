import type { StateDisclosureConfig } from "../types";

// TODO: Review all legal text with legal counsel before production use

export const floridaConfig: StateDisclosureConfig = {
  stateCode: "FL",
  stateName: "Florida",
  lawName: "Commercial Financing Disclosure Law",
  lawReference: "Florida Statutes § 559.9601 et seq.",
  effectiveDate: "2024-01-01",
  status: "active",
  version: "FL-2024-01-v1",

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
      "COMMERCIAL FINANCING DISCLOSURE — STATE OF FLORIDA\n" +
      "Pursuant to the Florida Commercial Financing Disclosure Law",

    disclosureNotice:
      "This disclosure is provided pursuant to Florida's Commercial Financing Disclosure Law " +
      "(Fla. Stat. § 559.9601 et seq.). The terms described below represent the commercial " +
      "financing transaction offered to you. Please review all terms carefully before signing.",

    prepaymentPolicy:
      "PREPAYMENT: Refer to your merchant agreement for specific prepayment terms and conditions.",

    collateralRequirements: null,
    personalGuarantee: null,
    rightOfRecission: null,

    additionalTerms: [
      "This is a purchase of future receivables, not a loan. The Annual Percentage Rate (APR) " +
      "is provided for comparison purposes as required by Florida law.",
    ],
  },
};
