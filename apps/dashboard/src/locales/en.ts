export default {
  categories: {
    meals: "Meals",
    travel: "Travel",
    software: "Software",
    office_supplies: "Office Supplies",
    internet_and_telephone: "Internet and Telephone",
    rent: "Rent",
    equipment: "Equipment",
    income: "Income",
    transfer: "Transfer",
    activity: "Activity",
    other: "Other",
    uncategorized: "Uncategorized",
    taxes: "Taxes",
    facilities_expenses: "Facilities Expenses",
  },
  transaction_methods: {
    card_purchase: "Card Purchase",
    payment: "Payment",
    card_atm: "Card ATM",
    transfer: "Transfer",
    other: "Other",
  },
  language: {
    title: "Languages",
    description: "Change the language used in the user interface.",
    placeholder: "Select language",
  },
  languages: {
    en: "English",
    sv: "Swedish",
  },
  spending_period: {
    this_month: "This month",
    last_month: "Last month",
    this_year: "This year",
    last_year: "Last year",
  },
  transactions_period: {
    all: "All",
    income: "Income",
    expense: "Expense",
  },
  chart_type: {
    profit_loss: "Profit/Loss",
    income: "Income",
  },
} as const;
