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
    return currencyFrequency.keys().next().value;
  }

  const mostFrequent = [...currencyFrequency.entries()].reduce((a, b) =>
    a[1] > b[1] ? a : b[1] === a[1] ? (a[0] < b[0] ? a : b) : b,
  );

  return mostFrequent[0];
}
