import type { StateDisclosureConfig } from "../types";

// TODO: Review all legal text with legal counsel before production use

export const californiaConfig: StateDisclosureConfig = {
  stateCode: "CA",
  stateName: "California",
  lawName: "Commercial Financing Disclosure Law (SB 1235)",
  lawReference:
    "California Civil Code Division 3, Part 4, Title 1.4C (Cal. Fin. Code § 22800 et seq.)",
  effectiveDate: "2022-12-09",
  status: "active",
  version: "CA-2022-12-v1",

  maxFundingThreshold: 500_000,
  requiresRegistration: false,

  requiredFields: [
    "fundingAmount",
    "totalRepaymentAmount",
    "financeCharge",
    "annualPercentageRate",
    "averageMonthlyCost",
    "paymentAmount",
    "paymentFrequency",
    "numberOfPayments",
    "prepaymentSavingsEstimate",
  ],

  // CA requires different disclosure formats by product type
  disclosureTypes: ["mca", "closed_end", "open_end", "factoring"],

  legalText: {
    header:
      "COMMERCIAL FINANCING DISCLOSURE — STATE OF CALIFORNIA\n" +
      "Pursuant to the California Commercial Financing Disclosure Law (SB 1235)",

    disclosureNotice:
      "This disclosure is provided pursuant to California's Commercial Financing Disclosure Law " +
      "(SB 1235, codified at Cal. Fin. Code § 22800 et seq.) and California Code of Regulations, " +
      "Title 10, Division 21. The terms described below represent the commercial financing " +
      "transaction offered to you. Please review all terms carefully before signing.",

    prepaymentPolicy:
      "PREPAYMENT: The estimated prepayment savings shown assume you prepay this financing " +
      "at the midpoint of the term. Actual savings depend on the specific terms of your agreement. " +
      "You may or may not be entitled to a reduction in the total cost if you prepay. " +
      "Refer to your merchant agreement for specific prepayment terms.",

    collateralRequirements:
      "COLLATERAL: This transaction may require you to pledge business assets as collateral.",

    personalGuarantee:
      "PERSONAL GUARANTEE: This transaction may require a personal guarantee.",

    rightOfRecission: null,

    additionalTerms: [
      "This is a purchase of future receivables, not a loan. The Annual Percentage Rate (APR) " +
      "is provided for comparison purposes as required by California law.",
      "The APR is calculated using the actuarial method. Because the actual payment amounts may " +
      "vary, the APR shown is an estimate based on the expected payment schedule.",
      "The average monthly cost represents the total dollar cost of this financing divided by " +
      "the number of months in the term.",
    ],
  },
};
