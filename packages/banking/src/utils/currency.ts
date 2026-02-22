/**
 * Returns true if the code is a valid ISO 4217 currency (not "XXX").
 * "XXX" is the ISO 4217 code for "no currency" — some PSD2 banks return it
 * at the account level while transactions have the real currency.
 */
export const isValidCurrency = (code?: string): boolean =>
  !!code && code.toUpperCase() !== "XXX";
