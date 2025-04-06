export const chartExampleData = {
  summary: {
    currency: "USD",
    currentTotal: 0,
    prevTotal: 0,
  },
  meta: {
    type: "profit" as "profit" | "revenue",
    period: "monthly",
    currency: "USD",
  },
  result: [
    {
      date: "Sun Jan 01 2023",
      previous: {
        date: "2022-1-1",
        currency: "USD",
        value: 10000,
      },
      current: {
        date: "2023-1-1",
        currency: "USD",
        value: 20300,
      },
      precentage: {
        value: 110,
        status: "positive",
      },
    },
    {
      date: "Wed Feb 01 2023",
      previous: {
        date: "2022-2-1",
        currency: "USD",
        value: 8000,
      },
      current: {
        date: "2023-2-1",
        currency: "USD",
        value: 14000,
      },
      precentage: {
        value: 1000,
        status: "positive",
      },
    },
    {
      date: "Wed Mar 01 2023",
      previous: {
        date: "2022-3-1",
        currency: "USD",
        value: 15000,
      },
      current: {
        date: "2023-3-1",
        currency: "USD",
        value: 18000,
      },
      precentage: {
        value: 1000,
        status: "positive",
      },
    },
    {
      date: "Sat Apr 01 2023",
      previous: {
        date: "2022-4-1",
        currency: "USD",
        value: 7000,
        status: "positive",
      },
      current: {
        date: "2023-4-1",
        currency: "USD",
        value: 10000,
        status: "positive",
      },
      precentage: {
        value: 1000,
        status: "positive",
      },
    },
    {
      date: "Mon May 01 2023",
      previous: {
        date: "2022-5-1",
        currency: "USD",
        value: 10000,
        status: "positive",
      },
      current: {
        date: "2023-5-1",
        currency: "USD",
        value: 12000,
        status: "positive",
      },
      precentage: {
        value: 1000,
        status: "positive",
      },
    },
    {
      date: "Thu Jun 01 2023",
      previous: {
        date: "2022-6-1",
        currency: "USD",
        value: 300,
        status: "negative",
      },
      current: {
        date: "2023-6-1",
        currency: "USD",
        value: 2800,
        status: "positive",
      },
      precentage: {
        value: 1000,
        status: "positive",
      },
    },
    {
      date: "Sat Jul 01 2023",
      previous: {
        date: "2022-7-1",
        currency: "USD",
        value: 1000,
        status: "positive",
      },
      current: {
        date: "2023-7-1",
        currency: "USD",
        value: 1000,
        status: "positive",
      },
      precentage: {
        value: 1000,
        status: "positive",
      },
    },
    {
      date: "Tue Aug 01 2023",
      previous: {
        date: "2022-8-1",
        currency: "USD",
        value: 1000,
        status: "positive",
      },
      current: {
        date: "2023-8-1",
        currency: "USD",
        value: 1000,
        status: "positive",
      },
      precentage: {
        value: 43,
        status: "positive",
      },
    },
    {
      date: "Fri Sep 01 2023",
      previous: {
        date: "2022-9-1",
        currency: "USD",
        value: 1000,
        status: "positive",
      },
      current: {
        date: "2023-9-1",
        currency: "USD",
        value: -3000,
        status: "negative",
      },
      precentage: {
        value: 53,
        status: "positive",
      },
    },
    {
      date: "Sun Oct 01 2023",
      previous: {
        date: "2022-10-1",
        currency: "USD",
        value: 10000,
        status: "positive",
      },
      current: {
        date: "2023-10-1",
        currency: "USD",
        value: 20000,
        status: "negative",
      },
      precentage: {
        value: 0,
        status: "positive",
      },
    },
    {
      date: "Wed Nov 01 2023",
      previous: {
        date: "2022-11-1",
        currency: "USD",
        value: 10000,
        status: "positive",
      },
      current: {
        date: "2023-11-1",
        currency: "USD",
        value: 20000,
        status: "negative",
      },
      precentage: {
        value: 0,
        status: "negative",
      },
    },
  ],
};

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

export const expenseChartExampleData = {
  summary: {
    currency: "USD",
    averageExpense: 800000,
  },
  meta: {
    type: "expense",
    period: "monthly",
    currency: "USD",
  },
  result: [
    {
      date: "2023-01-01",
      value: 20300,
      recurring: 1000,
      total: 20300,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-02-01",
      value: 14000,
      recurring: 1000,
      total: 14000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-03-01",
      value: 18000,
      recurring: 1000,
      total: 18000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-04-01",
      value: 10000,
      recurring: 1000,
      total: 10000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-05-01",
      value: 12000,
      recurring: 1000,
      total: 12000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-06-01",
      value: 2800,
      recurring: 1000,
      total: 2800,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-07-01",
      value: 1000,
      recurring: 1000,
      total: 1000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-08-01",
      value: 1000,
      recurring: 1000,
      total: 1000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-09-01",
      value: 3000,
      recurring: 1000,
      total: 3000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-10-01",
      value: 20000,
      recurring: 1000,
      total: 20000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-11-01",
      value: 20000,
      recurring: 1000,
      total: 20000,
      recurring_value: 1000,
      currency: "USD",
    },
    {
      date: "2023-12-01",
      value: 15000,
      recurring: 1000,
      total: 15000,
      recurring_value: 1000,
      currency: "USD",
    },
  ],
};

export const burnRateExamleData = [
  { value: 1000, date: "2024-01-01", currency: "USD" },
  { value: 4000, date: "2024-01-02", currency: "USD" },
  { value: 3000, date: "2024-01-03", currency: "USD" },
  { value: 12000, date: "2024-01-04", currency: "USD" },
  { value: 5000, date: "2024-01-05", currency: "USD" },
  { value: 6000, date: "2024-01-06", currency: "USD" },
  { value: 4500, date: "2024-01-07", currency: "USD" },
  { value: 8000, date: "2024-01-08", currency: "USD" },
  { value: 9000, date: "2024-01-09", currency: "USD" },
  { value: 500, date: "2024-01-10", currency: "USD" },
  { value: 1000, date: "2024-01-11", currency: "USD" },
  { value: 500, date: "2024-01-12", currency: "USD" },
];
