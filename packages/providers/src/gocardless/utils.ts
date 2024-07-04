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
    "BRED_BREDFRPPXXX",
    "SWEDBANK_SWEDSESS",
    "INDUSTRA_MULTLV2X",
    "MEDICINOSBANK_MDBALT22XXX",
    "CESKA_SPORITELNA_LONG_GIBACZPX",
    "LHV_LHVBEE22",
    "BRED_BREDFRPP",
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
    // "LUMINOR_", TODO: Fix based on contry (all countries)
    // 'SEB_', (Baltics)
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
