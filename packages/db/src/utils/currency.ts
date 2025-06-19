export function calculateAccountBaseBalance(params: {
  balance: number;
  currency: string;
  baseCurrency: string;
  exchangeRate: number;
}): number {
  const { balance, currency, baseCurrency, exchangeRate } = params;

  // If currencies are the same, no conversion needed
  if (currency === baseCurrency) {
    return balance;
  }

  // Convert balance using exchange rate
  return Number((balance * exchangeRate).toFixed(2));
}

export function calculateTransactionBaseAmount(params: {
  amount: number;
  currency: string;
  baseCurrency: string;
  exchangeRate: number;
}): number {
  const { amount, currency, baseCurrency, exchangeRate } = params;

  // If currencies are the same, no conversion needed
  if (currency === baseCurrency) {
    return amount;
  }

  // Convert amount using exchange rate
  return Number((amount * exchangeRate).toFixed(2));
}
