export const chartData = {
  summary: {
    currency: "SEK",
    currentTotal: Math.floor(Math.random() * 100000) + 800000,
    prevTotal: Math.floor(Math.random() * 100000) + 800000,
  },
  meta: {
    type: "profit_loss",
    period: "monthly",
    currency: "SEK",
  },
  result: [
    {
      date: "Sun Jan 01 2023",
      previous: {
        date: "2022-1-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
      },
      current: {
        date: "2023-1-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
      },
      precentage: {
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
    },
    {
      date: "Wed Feb 01 2023",
      previous: {
        date: "2022-2-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
      },
      current: {
        date: "2023-2-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
      },
      precentage: {
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
    },
    {
      date: "Wed Mar 01 2023",
      previous: {
        date: "2022-3-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
      },
      current: {
        date: "2023-3-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
      },
      precentage: {
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
    },
    {
      date: "Sat Apr 01 2023",
      previous: {
        date: "2022-4-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        date: "2023-4-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      precentage: {
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
    },
    {
      date: "Mon May 01 2023",
      previous: {
        date: "2022-5-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        date: "2023-5-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      precentage: {
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
    },
    {
      date: "Thu Jun 01 2023",
      previous: {
        date: "2022-6-1",
        value: -Math.floor(Math.random() * 100000) + 1000,
        status: "negative",
      },
      current: {
        date: "2023-6-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      precentage: {
        currency: "SEK",
        value: 23,
        status: "positive",
      },
    },
    {
      date: "Sat Jul 01 2023",
      previous: {
        date: "2022-7-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        date: "2023-7-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      precentage: {
        currency: "SEK",
        value: 21,
        status: "positive",
      },
    },
    {
      date: "Tue Aug 01 2023",
      previous: {
        date: "2022-8-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        date: "2023-8-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      precentage: {
        currency: "SEK",
        value: 43,
        status: "positive",
      },
    },
    {
      date: "Fri Sep 01 2023",
      previous: {
        date: "2022-9-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        currency: "SEK",
        date: "2023-9-1",
        value: -Math.floor(Math.random() * 100000) + 1000,
        status: "negative",
      },
      precentage: {
        currency: "SEK",
        value: 53,
        status: "positive",
      },
    },
    {
      date: "Sun Oct 01 2023",
      previous: {
        date: "2022-10-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        currency: "SEK",
        date: "2023-10-1",
        value: -Math.floor(Math.random() * 100000) + 1000,
        status: "negative",
      },
      precentage: {
        currency: "SEK",
        value: 0,
        status: "positive",
      },
    },
    {
      date: "Wed Nov 01 2023",
      previous: {
        date: "2022-11-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "positive",
      },
      current: {
        date: "2023-11-1",
        currency: "SEK",
        value: Math.floor(Math.random() * 100000) + 1000,
        status: "negative",
      },
      precentage: {
        currency: "SEK",
        value: 0,
        status: "negative",
      },
    },
  ],
};

export const spendingData = {
  meta: {
    count: 100,
    totalAmount: 234234,
    currency: "SEK",
  },
  data: [
    {
      category: "travel",
      currency: "SEK",
      amount: 300,
    },
    {
      category: "office_supplies",
      currency: "SEK",
      amount: 50,
    },
    {
      category: "software",
      currency: "SEK",
      amount: 240,
    },
    {
      category: "rent",
      currency: "SEK",
      amount: 130,
    },
    {
      category: "meals",
      currency: "SEK",
      amount: 200,
    },
    {
      category: "transfer",
      currency: "SEK",
      amount: 30,
    },
    {
      category: "other",
      currency: "SEK",
      amount: 123,
    },
    {
      category: "equipment",
      currency: "SEK",
      amount: 123,
    },
    {
      category: "uncategorized",
      currency: "SEK",
      amount: 123,
    },
  ],
};

export const transactionList = {
  data: [
    { id: 1, name: "Spotify", amount: -199, currency: "SEK" },
    { id: 2, name: "Netflix", amount: -179, currency: "SEK" },
    { id: 3, name: "WeWork", amount: -6700, currency: "SEK" },
    {
      id: 4,
      name: "Acme Inc",
      amount: 76300,
      currency: "SEK",
      attachments: [{}],
      vat: 25,
    },
    {
      id: 5,
      name: "GitHub",
      amount: -99,
      currency: "SEK",
      attachments: [{}],
      vat: 25,
    },
    {
      id: 6,
      name: "Supabase",
      amount: -299,
      currency: "SEK",
      attachments: [{}],
      vat: 25,
    },
    {
      id: 7,
      name: "Acme Inc",
      amount: 86300,
      currency: "SEK",
      attachments: [{}],
      vat: 25,
    },
  ],
};
