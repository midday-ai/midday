import type { StateDisclosureConfig } from "../../types";

export const georgiaConfig: StateDisclosureConfig = {
  stateCode: "GA",
  stateName: "Georgia",
  lawName: "Commercial Financing Disclosure (Proposed)",
  lawReference: "Pending legislation",
  effectiveDate: "",
  status: "pending",
  version: "GA-pending-v0",

  maxFundingThreshold: 500_000,
  requiresRegistration: false,

  requiredFields: [],
  disclosureTypes: ["mca"],

  legalText: {
    header: "",
    disclosureNotice: "",
    prepaymentPolicy: "",
    collateralRequirements: null,
    personalGuarantee: null,
    rightOfRecission: null,
    additionalTerms: [],
  },
};
