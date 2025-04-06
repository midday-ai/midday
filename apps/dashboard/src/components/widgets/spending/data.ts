import { getColorFromName } from "@/utils/categories";
import {
  formatISO,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

export const defaultPeriod = {
  id: "last_30d",
  from: formatISO(subDays(new Date(), 30), { representation: "date" }),
  to: formatISO(new Date(), { representation: "date" }),
};

export const options = [
  defaultPeriod,
  {
    id: "this_month",
    from: formatISO(startOfMonth(new Date()), { representation: "date" }),
    to: formatISO(new Date(), { representation: "date" }),
  },
  {
    id: "last_month",
    from: formatISO(subMonths(startOfMonth(new Date()), 1), {
      representation: "date",
    }),
    to: formatISO(new Date(), { representation: "date" }),
  },
  {
    id: "this_year",
    from: formatISO(startOfYear(new Date()), { representation: "date" }),
    to: formatISO(new Date(), { representation: "date" }),
  },
  {
    id: "last_year",
    from: formatISO(subYears(startOfMonth(new Date()), 1), {
      representation: "date",
    }),
    to: formatISO(new Date(), { representation: "date" }),
  },
];

export const spendingExampleData = {
  meta: {
    count: 100,
    totalAmount: 234234,
    currency: "USD",
  },
  data: [
    {
      slug: "rent",
      color: getColorFromName("Rent"),
      name: "Rent",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "meals",
      color: getColorFromName("Meals"),
      name: "Meals",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "other",
      color: getColorFromName("Other"),
      name: "Other",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "internet_and_telephone",
      color: getColorFromName("Internet and Telephone"),
      name: "Internet and Telephone",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "facilities_expenses",
      color: getColorFromName("Facilities Expenses"),
      name: "Facilities Expenses",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "transfer",
      color: getColorFromName("Transfer"),
      name: "Transfer",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "software",
      color: getColorFromName("Software"),
      name: "Software",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "equipment",
      color: getColorFromName("Equipment"),
      name: "Equipment",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "office_supplies",
      color: getColorFromName("Office Supplies"),
      name: "Office Supplies",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "uncategorized",
      color: getColorFromName("Uncategorized"),
      name: "Uncategorized",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "fees",
      color: getColorFromName("Fees"),
      name: "Fees",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
    {
      slug: "travel",
      color: getColorFromName("Travel"),
      name: "Travel",
      currency: "USD",
      amount: 0,
      precentage: 0,
    },
  ],
};
