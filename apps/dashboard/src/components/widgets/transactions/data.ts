export const options = ["all", "income", "expense"] as const;
export type TransactionType = (typeof options)[number];

export const transactionExampleData = {
  data: [
    { id: 1, name: "Spotify", amount: -199, currency: "USD" },
    { id: 2, name: "Netflix", amount: -179, currency: "USD" },
    { id: 3, name: "WeWork", amount: -6700, currency: "USD" },
    {
      id: 4,
      name: "Acme Inc",
      amount: 76300,
      currency: "USD",
    },
    {
      id: 5,
      name: "GitHub",
      amount: -99,
      currency: "USD",
    },
    {
      id: 6,
      name: "Supabase",
      amount: -299,
      currency: "USD",
    },
    {
      id: 7,
      name: "Acme Inc",
      amount: 86300,
      currency: "USD",
    },
  ],
};
