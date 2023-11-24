import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  TransactionsEnrichRequest,
} from "plaid";

export const createPlaidClient = () => {
  const configuration = new Configuration({
    basePath: PlaidEnvironments.development,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_CLIENT_SECRET!,
        "Plaid-Version": "2020-09-14",
      },
    },
  });

  return new PlaidApi(configuration);
};

export async function enrichTransactions(transactions: any) {
  const client = createPlaidClient();

  const request: TransactionsEnrichRequest = {
    account_type: "depository",
    transactions,
  };

  return client.transactionsEnrich(request);
}
