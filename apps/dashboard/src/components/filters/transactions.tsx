"use client";

import { SectionType } from "@/components/filter";
import {
  addDays,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { Calendar, CreditCard, Search, Tag, User } from "lucide-react";

export const sections = [
  {
    id: "date",
    label: "Date",
    icon: Calendar,
    type: SectionType.date,
    options: [
      {
        id: "today",
        label: "Today",
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      },
      {
        id: "tomorrow",
        label: "Tomorrow",
        from: startOfDay(addDays(new Date(), 1)),
        to: endOfDay(addDays(new Date(), 1)),
      },
      {
        id: "this_month",
        label: "This month",
        from: startOfDay(startOfMonth(new Date())),
        to: endOfDay(new Date()),
      },
      {
        id: "last_month",
        label: "Last month",
        from: startOfDay(startOfMonth(subMonths(new Date(), 1))),
        to: endOfDay(endOfMonth(subMonths(new Date(), 1))),
      },
      {
        id: "last_30_days",
        label: "Last 30 days",
        from: startOfDay(subDays(new Date(), 30)),
        to: endOfDay(new Date()),
      },
      {
        label: "This year",
        id: "this_year",
        from: startOfDay(startOfYear(subMonths(new Date(), 1))),
        to: endOfDay(new Date()),
      },
    ],
  },
  {
    id: "search",
    storage: "search_orders",
    label: "Keywords",
    icon: Search,
    type: SectionType.search,
    placeholder: "Search for transactions, amount...",
    options: [],
  },
  //   {
  //     id: "delivery_type",
  //     label: "Delivery type",
  //     icon: Truck,
  //     type: SectionType.checkbox,
  //     options: [
  //       {
  //         // id: SearchDeliveryType.Delivery,
  //         label: "Delivery",
  //         description: "Orders with Delivery type",
  //       },
  //       {
  //         // id: SearchDeliveryType.Pickup,
  //         label: "Pickup",
  //         description: "Orders with Pickup type",
  //       },
  //     ],
  //   },
  {
    id: "method",
    label: "Method",
    icon: CreditCard,
    type: SectionType.checkbox,
    options: [
      {
        // id: SearchCustomerType.Wholesale,
        label: "Card",
        description: "Transactions with method Card",
      },
      {
        // id: SearchCustomerType.Wholesale,
        label: "Card foreign purchase",
        description: "Transactions with method Card foreign purchase",
      },
      {
        // id: SearchCustomerType.Retail,
        label: "Payment",
        description: "Transactions with method Payment",
      },
      {
        // id: SearchCustomerType.Retail,
        label: "Transfer",
        description: "Transactions with method Transfer",
      },
      {
        // id: SearchCustomerType.Retail,
        label: "Incoming foreign payment",
        description: "Transactions with method Incoming foreign payment",
      },
      {
        // id: SearchCustomerType.Retail,
        label: "Bankgiro payment",
        description: "Transactions with method Bankgiro payment",
      },
    ],
  },
  {
    id: "assigned",
    label: "Assigned",
    icon: User,
    type: SectionType.checkbox,
    options: [
      {
        // id: SearchOrderStatus.New,
        label: "Fullfilled",
        description: "Transactions with the status Fullfilled",
      },
      //   {
      //     // id: SearchOrderStatus.OutForDelivery,
      //     label: "Out for delivery",
      //     description: "Orders with the status Out for delivery",
      //   },
    ],
  },
  {
    id: "status",
    label: "Status",
    icon: Tag,
    type: SectionType.checkbox,
    options: [
      {
        // id: SearchOrderStatus.New,
        label: "Fullfilled",
        description: "Transactions with the status Fullfilled",
      },
      //   {
      //     // id: SearchOrderStatus.OutForDelivery,
      //     label: "Out for delivery",
      //     description: "Orders with the status Out for delivery",
      //   },
    ],
  },
];
