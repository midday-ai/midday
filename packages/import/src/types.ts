export type Transaction = {
  date: string;
  description?: string;
  counterparty?: string;
  amount: string;
  teamId: string;
  bankAccountId: string;
  currency: string;
};
