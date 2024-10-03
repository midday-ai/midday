/**
 * Determines the most frequently occurring currency among a list of accounts.
 *
 * @param accounts - An array of account objects, each containing a 'currency' property.
 * @returns The most frequent currency as a string, or null if the input array is empty.
 *
 * @remarks
 * This function handles the following cases:
 * - If the input array is empty, it returns null.
 * - If all accounts have the same currency, it returns that currency.
 * - If there are multiple currencies, it returns the most frequent one.
 * - In case of a tie, it returns the alphabetically first currency among the tied currencies.
 *
 * @example
 * const accounts = [
 *   { currency: 'USD' },
 *   { currency: 'EUR' },
 *   { currency: 'USD' },
 *   { currency: 'GBP' }
 * ];
 * const result = getMostFrequentCurrency(accounts);
 * console.log(result); // Outputs: 'USD'
 */
export function getMostFrequentCurrency(
  accounts: { currency: string }[],
): string | null {
  if (accounts.length === 0) {
    return null;
  }

  const currencyFrequency = accounts.reduce((acc, account) => {
    acc.set(account.currency, (acc.get(account.currency) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  if (currencyFrequency.size === 1) {
    return currencyFrequency.keys().next().value as string;
  }

  const mostFrequent = [...currencyFrequency.entries()].reduce((a, b) =>
    a[1] > b[1] ? a : b[1] === a[1] ? (a[0] < b[0] ? a : b) : b,
  );

  return mostFrequent[0];
}

/**
 * Formats a number as a currency string.
 *
 * @param amount - The numeric amount to format.
 * @param currency - The ISO 4217 currency code to use for formatting (default: 'USD').
 * @param locale - The BCP 47 language tag to use for locale-specific formatting (default: 'en-US').
 * @returns A formatted currency string.
 *
 * @remarks
 * This function uses the Intl.NumberFormat API to perform locale-aware currency formatting.
 * The formatting includes the appropriate currency symbol, thousand separators, and decimal places
 * according to the specified locale and currency.
 *
 * @example
 * console.log(formatCurrency(1234.56)); // Outputs: '$1,234.56'
 * console.log(formatCurrency(1234.56, 'EUR', 'de-DE')); // Outputs: '1.234,56 €'
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat | Intl.NumberFormat}
 * for more information on the underlying API used for formatting.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}
