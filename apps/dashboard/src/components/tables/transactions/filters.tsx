"use client";

import { SectionType } from "@/components/filter";
import {
  endOfDay,
  endOfMonth,
  formatISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { Archive, Calendar, Landmark, Paperclip, Tag } from "lucide-react";

export function transactionSections({ categories, accounts }) {
  return [
    {
      id: "date",
      label: "Date",
      icon: Calendar,
      type: SectionType.date,
      options: [
        {
          id: "today",
          label: "Today",
          from: formatISO(startOfDay(new Date()), {
            representation: "date",
          }),
          to: formatISO(endOfDay(new Date()), {
            representation: "date",
          }),
        },
        {
          id: "this_month",
          label: "This month",
          from: formatISO(startOfDay(startOfMonth(new Date())), {
            representation: "date",
          }),
          to: formatISO(endOfDay(new Date()), {
            representation: "date",
          }),
        },
        {
          id: "last_month",
          label: "Last month",
          from: formatISO(startOfDay(startOfMonth(subMonths(new Date(), 1))), {
            representation: "date",
          }),
          to: formatISO(endOfDay(endOfMonth(subMonths(new Date(), 1))), {
            representation: "date",
          }),
        },
        {
          id: "last_30_days",
          label: "Last 30 days",
          from: formatISO(startOfDay(subDays(new Date(), 30)), {
            representation: "date",
          }),
          to: formatISO(endOfDay(new Date()), {
            representation: "date",
          }),
        },
        {
          label: "This year",
          id: "this_year",
          from: formatISO(startOfDay(startOfYear(subMonths(new Date(), 1))), {
            representation: "date",
          }),
          to: formatISO(endOfDay(new Date()), {
            representation: "date",
          }),
        },
      ],
    },
    {
      id: "status",
      label: "Status",
      icon: Tag,
      type: SectionType.checkbox,
      options: [
        {
          id: "fullfilled",
          label: "Fullfilled",
          description: "Transactions with the status Fullfilled",
        },
        {
          id: "unfulfilled",
          label: "Unfulfilled",
          description: "Transactions with the status Unfulfilled",
        },
        {
          id: "excluded",
          label: "Excluded",
          description: "Transactions with the status Excluded",
        },
      ],
    },
    {
      id: "attachments",
      label: "Attachments",
      icon: Paperclip,
      type: SectionType.radio,
      defaultValue: "all",
      options: [
        {
          id: "all",
          label: "All",
        },
        {
          id: "include",
          label: "Has attachment",
        },
        {
          id: "exclude",
          label: "No attachment",
        },
      ],
    },
    {
      id: "categories",
      label: "Categories",
      icon: Archive,
      type: SectionType.checkbox,
      renderLabel: (value) => value.name,
      options: [
        ...categories,
        { slug: "uncategorized", name: "Uncategorized" },
      ].map((category) => ({
        id: category.slug,
        label: category.name,
      })),
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: Landmark,
      type: SectionType.checkbox,
      renderLabel: (value) => value.name,
      options: accounts.map((account) => ({
        id: account.id,
        label: account?.currency
          ? `${account.name} (${account.currency})`
          : account.name,
      })),
    },
  ];
}
