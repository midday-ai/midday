type GetAccountBalanceParams = {
  currency: string;
  balance: number;
  baseCurrency: string;
  rate: number | null;
};

export function getAccountBalance({
  currency,
  balance,
  baseCurrency,
  rate,
}: GetAccountBalanceParams) {
  if (currency === baseCurrency) {
    return balance;
  }

  return +(balance * (rate ?? 1)).toFixed(2);
}

type GetTransactionAmountParams = {
  amount: number;
  currency: string;
  baseCurrency: string;
  rate: number | null;
};

export function getTransactionAmount({
  amount,
  currency,
  baseCurrency,
  rate,
}: GetTransactionAmountParams) {
  if (currency === baseCurrency) {
    return amount;
  }

  return +(amount * (rate ?? 1)).toFixed(2);
}
