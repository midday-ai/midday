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

export const spendingExampleData = [
  {
    slug: "rent",
    color: getColorFromName("Rent") || "#FF6900",
    name: "Rent",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "meals",
    color: getColorFromName("Meals") || "#FCB900",
    name: "Meals",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "other",
    color: getColorFromName("Other") || "#00D084",
    name: "Other",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "internet-and-telephone",
    color: getColorFromName("Internet and Telephone") || "#8ED1FC",
    name: "Internet and Telephone",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "facilities-expenses",
    color: getColorFromName("Facilities Expenses") || "#0693E3",
    name: "Facilities Expenses",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "transfer",
    color: getColorFromName("Transfer") || "#ABB8C3",
    name: "Transfer",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "software",
    color: getColorFromName("Software") || "#EB144C",
    name: "Software",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "equipment",
    color: getColorFromName("Equipment") || "#F78DA7",
    name: "Equipment",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "office-supplies",
    color: getColorFromName("Office Supplies") || "#9900EF",
    name: "Office Supplies",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "uncategorized",
    color: getColorFromName("Uncategorized") || "#0079BF",
    name: "Uncategorized",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "fees",
    color: getColorFromName("Fees") || "#B6BBBF",
    name: "Fees",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
  {
    slug: "travel",
    color: getColorFromName("Travel") || "#FF5A5F",
    name: "Travel",
    currency: "USD",
    amount: 0,
    percentage: 0,
  },
];
