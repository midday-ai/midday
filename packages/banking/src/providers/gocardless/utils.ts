import { isValidCurrency } from "../../utils/currency";
import type { AccountBalance } from "./types";

/**
 * Select the primary balance from a list of balances.
 *
 * Priority (booked-first for accounting accuracy):
 *   1. interimBooked  – current intraday settled balance
 *   2. closingBooked  – end-of-day settled balance
 *   3. interimAvailable – current available (may include credit limits)
 *   4. expected
 *   5. any remaining balance
 *
 * When `preferredCurrency` is provided, balances matching that currency are
 * tried first within each tier. This prevents multi-currency accounts from
 * picking the wrong currency based on raw amount comparison.
 */
export function selectPrimaryBalance(
  balances: AccountBalance[] | undefined,
  preferredCurrency?: string,
): AccountBalance | undefined {
  if (!balances?.length) return undefined;

  const tiers: ((b: AccountBalance) => boolean)[] = [
    (b) => b.balanceType === "interimBooked",
    (b) => b.balanceType === "closingBooked",
    (b) => b.balanceType === "interimAvailable",
    (b) => b.balanceType === "expected",
  ];

  const pickHighest = (items: AccountBalance[]): AccountBalance | undefined =>
    items.length === 0
      ? undefined
      : items.reduce((max, current) => {
          const curAbs = Math.abs(+current.balanceAmount.amount);
          const maxAbs = Math.abs(+max.balanceAmount.amount);
          return curAbs > maxAbs ? current : max;
        });

  const hasCurrencyHint =
    preferredCurrency && isValidCurrency(preferredCurrency);
  const currencyMatch = hasCurrencyHint
    ? balances.filter(
        (b) =>
          b.balanceAmount.currency.toUpperCase() ===
          preferredCurrency.toUpperCase(),
      )
    : [];

  for (const match of tiers) {
    if (currencyMatch.length) {
      const winner = pickHighest(currencyMatch.filter(match));
      if (winner) return winner;
    }
    const winner = pickHighest(balances.filter(match));
    if (winner) return winner;
  }

  return currencyMatch[0] ?? balances[0];
}

export function parseProviderError(
  error: unknown,
): { code: string; message: string } | false {
  if (!error) return false;

  const data = (
    error as {
      response?: {
        data?: { summary?: string; detail?: string; type?: string };
      };
    }
  ).response?.data;

  if (!data?.detail) return false;

  return {
    code: data.type || data.summary || "UNKNOWN",
    message: data.detail,
  };
}

type GetMaxHistoricalDays = {
  transactionTotalDays: number;
  institutionId: string;
};

// https://bankaccountdata.zendesk.com/hc/en-gb/articles/11529718632476-Extended-history-and-continuous-access-edge-cases
export function getMaxHistoricalDays({
  transactionTotalDays,
  institutionId,
}: GetMaxHistoricalDays) {
  const RESTRICTED_TO_90DAYS = [
    "BRED_BREDFRPP",
    "SWEDBANK_SWEDSESS",
    "INDUSTRA_MULTLV2X",
    "MEDICINOSBANK_MDBALT22",
    "CESKA_SPORITELNA_LONG_GIBACZPX",
    "LHV_LHVBEE22",
    "LABORALKUTXA_CLPEES2M",
    "BANKINTER_BKBKESMM",
    "CAIXABANK_CAIXESBB",
    "JEKYLL_JEYKLL002",
    "SANTANDER_DE_SCFBDE33",
    "BBVA_BBVAESMM",
    "BANCA_AIDEXA_AIDXITMM",
    "BANCA_PATRIMONI_SENVITT1",
    "BANCA_SELLA_SELBIT2B",
    "CARTALIS_CIMTITR1",
    "DOTS_HYEEIT22",
    "HYPE_BUSINESS_HYEEIT22",
    "HYPE_HYEEIT2",
    "ILLIMITY_ITTPIT2M",
    "SMARTIKA_SELBIT22",
    "TIM_HYEEIT22",
    "TOT_SELBIT2B",
    "OPYN_BITAITRRB2B",
    "PAYTIPPER_PAYTITM1",
    "SELLA_PERSONAL_CREDIT_SELBIT22",
  ];

  const RESTRICTED_TO_180DAYS = ["COOP_EKRDEE22"];

  if (RESTRICTED_TO_90DAYS.some((str) => str.startsWith(institutionId))) {
    return 90;
  }

  if (RESTRICTED_TO_180DAYS.some((str) => str.startsWith(institutionId))) {
    return 180;
  }

  return transactionTotalDays;
}
