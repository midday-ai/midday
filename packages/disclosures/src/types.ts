/**
 * Input types for the disclosure calculation engine.
 * All calculations are deterministic — no AI, no randomness.
 */

export interface DealFee {
  feeType: "origination" | "processing" | "underwriting" | "broker" | "other";
  feeName: string;
  amount: number;
  /** Optional: fee as a percentage of funding amount (for display only) */
  percentage: number | null;
}

export interface DealTerms {
  fundingAmount: number;
  factorRate: number;
  paybackAmount: number;
  dailyPayment: number | null;
  paymentFrequency: "daily" | "weekly" | "bi_weekly" | "monthly";
  /** ISO date string — required for disclosure generation */
  fundedAt: string;
  /** ISO date string — required for disclosure generation */
  expectedPayoffDate: string;
  fees: DealFee[];
}

export interface DisclosureFigures {
  // Core calculations
  fundingAmount: number;
  totalRepaymentAmount: number;
  financeCharge: number;
  annualPercentageRate: number;
  averageMonthlyCost: number;
  /** paybackAmount / fundingAmount — e.g., 1.35 means $1.35 per $1.00 funded */
  centsOnDollar: number;

  // Payment details
  paymentAmount: number;
  paymentFrequency: string;
  numberOfPayments: number;
  termLengthDays: number;

  // Fee breakdown
  totalFees: number;
  feeBreakdown: { name: string; amount: number }[];

  // Prepayment
  prepaymentSavingsEstimate: number | null;

  // Metadata
  calculatedAt: string;
  calculationVersion: string;
}

export type DisclosureStatus =
  | "active"
  | "pending";

export type DisclosureType =
  | "mca"
  | "closed_end"
  | "open_end"
  | "factoring";

export interface StateDisclosureConfig {
  stateCode: string;
  stateName: string;
  lawName: string;
  lawReference: string;
  effectiveDate: string;
  status: DisclosureStatus;
  version: string;

  // Thresholds
  maxFundingThreshold: number;
  requiresRegistration: boolean;

  // Which figures are legally required for this state
  requiredFields: (keyof DisclosureFigures)[];

  // Supported disclosure types (CA has multiple)
  disclosureTypes: DisclosureType[];

  // Legal text sections
  legalText: {
    header: string;
    disclosureNotice: string;
    prepaymentPolicy: string;
    collateralRequirements: string | null;
    personalGuarantee: string | null;
    rightOfRecission: string | null;
    additionalTerms: string[];
  };
}

/** Information about the parties for PDF rendering */
export interface DisclosurePartyInfo {
  dealCode: string;
  merchantName: string;
  merchantAddress: string;
  merchantState: string;
  funderName: string;
  funderAddress: string;
  fundedDate: string;
}
