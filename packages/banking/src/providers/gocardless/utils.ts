import {
  type BalanceAdapter,
  selectPrimaryBalance as selectPrimaryBalanceCore,
} from "../../utils/balance";
import type { AccountBalance } from "./types";

const balanceAdapter: BalanceAdapter<AccountBalance> = {
  getType: (b) => b.balanceType,
  getAmount: (b) => b.balanceAmount.amount,
  getCurrency: (b) => b.balanceAmount.currency,
};

const TIERS = [
  ["interimBooked"],
  ["closingBooked"],
  ["interimAvailable"],
  ["expected"],
];

export function selectPrimaryBalance(
  balances: AccountBalance[] | undefined,
  preferredCurrency?: string,
): AccountBalance | undefined {
  return selectPrimaryBalanceCore(
    balances,
    balanceAdapter,
    TIERS,
    preferredCurrency,
  );
}

export function parseProviderError(
  error: unknown,
): { code: string; message: string; statusCode?: number } | false {
  if (!error) return false;

  const response = (
    error as {
      response?: {
        status?: number;
        data?: {
          summary?: string;
          detail?: string;
          type?: string;
          status_code?: number;
        };
      };
    }
  ).response;

  if (!response?.data?.detail) return false;

  return {
    code: response.data.type || response.data.summary || "UNKNOWN",
    message: response.data.detail,
    statusCode: response.status ?? response.data.status_code,
  };
}

type GetMaxHistoricalDays = {
  transactionTotalDays: number;
  institutionId: string;
  separateContinuousHistoryConsent?: boolean;
};

// https://bankaccountdata.zendesk.com/hc/en-gb/articles/11529718632476-Extended-history-and-continuous-access-edge-cases
//
// Banks with separate_continuous_history_consent only provide extended history
// once and require a separate consent for continuous access. The GoCardless API
// exposes this as a flag on the institution, but we keep a hardcoded fallback
// list for institutions where the flag may not be populated.
const RESTRICTED_INSTITUTIONS = new Set([
  "BRED_BREDFRPP",
  "SWEDBANK_SWEDSESS",
  "INDUSTRA_MULTLV2X",
  "MEDICINOSBANK_MDBALT22",
  "CESKA_SPORITELNA_LONG_GIBACZPX",
  "LHV_LHVBEE22",
  "LABORALKUTXA_CLPEES2M",
  "BANKINTER_BKBKESMM",
  "CAIXABANK_CAIXESBB",
  "SANTANDER_DE_SCFBDE33",
  "BBVA_BBVAESMM",
]);

export function getMaxHistoricalDays({
  transactionTotalDays,
  institutionId,
  separateContinuousHistoryConsent,
}: GetMaxHistoricalDays) {
  if (
    separateContinuousHistoryConsent ||
    RESTRICTED_INSTITUTIONS.has(institutionId)
  ) {
    return 90;
  }

  return transactionTotalDays;
}
