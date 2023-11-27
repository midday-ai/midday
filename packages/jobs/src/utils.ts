import { capitalCase } from "change-case";

export const mapTransactionMethod = (method: string) => {
  switch (method) {
    case "Payment":
    case "Bankgiro payment":
    case "Incoming foreign payment":
      return "payment";
    case "Card purchase":
    case "Card foreign purchase":
      return "card_purchase";
    case "Card ATM":
      return "card_atm";
    case "Transfer":
      return "transfer";
    default:
      return "other";
  }
};

export async function processPromisesBatch(
  items: Array<any>,
  limit: number,
  fn: (item: any) => Promise<any>
): Promise<any> {
  let results = [];
  for (let start = 0; start < items.length; start += limit) {
    const end = start + limit > items.length ? items.length : start + limit;

    const slicedResults = await Promise.all(items.slice(start, end).map(fn));

    results = [...results, ...slicedResults];
  }

  return results;
}

export const transformTransactions = (transactions, { teamId, accountId }) => {
  return transactions?.map((data) => {
    const name = capitalCase(data.additionalInformation);
    const amount = data.transactionAmount.amount;

    return {
      transaction_id: data.transactionId ?? null,
      reference: data.entryReference ?? null,
      booking_date: data.bookingDate ?? null,
      date: data.valueDate,
      name,
      original: data.additionalInformation,
      method: mapTransactionMethod(data.proprietaryBankTransactionCode),
      // internal_id: data.internalTransactionId ?? null,
      amount,
      currency: data.transactionAmount.currency,
      bank_account_id: accountId,
      category: amount > 0 ? "income" : null,
      team_id: teamId,
      pending: data?.pending,
      // We use name, amount, valueDate and accountId to generate a unique ID for pending transactions
      internal_id: Buffer.from(
        `${name}_${amount}_${data.valueDate}_${accountId}`
      ).toString("base64"),
    };
  });
};
