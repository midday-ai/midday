export default {
  transaction_methods: {
    card_purchase: "Card Purchase",
    payment: "Payment",
    card_atm: "Card ATM",
    transfer: "Transfer",
    other: "Other",
    ach: "Ach",
    deposit: "Deposit",
    wire: "Wire",
    fee: "Fee",
    interest: "Interest",
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
    last_30d: "Last 30d",
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
  inbox_filter: {
    all: "All",
    todo: "Todo",
    done: "Done",
  },
  chart_type: {
    profit: "Profit",
    revenue: "Revenue",
    burn_rate: "Burn rate",
  },
  folders: {
    all: "All",
    exports: "Exports",
    inbox: "Inbox",
    imports: "Imports",
    transactions: "Transactions",
  },
  mfa_status: {
    verified: "Verified",
    unverified: "Unverified",
  },
  roles: {
    owner: "Owner",
    member: "Member",
  },
  tracker_status: {
    in_progress: "In progress",
    completed: "Completed",
  },
  notifications: {
    inbox: "Receive notifications about new items in your inbox.",
    match: "Receive notifications about matches.",
    transactions: "Receive notifications about new transactions.",
  },
  widgets: {
    insights: "Assistant",
    inbox: "Inbox",
    spending: "Spending",
    transactions: "Transactions",
    tracker: "Tracker",
  },
  bottom_bar: {
    "transactions#one": "1 Transaction",
    "transactions#other": "{count} Transactions",
    multi_currency: "Multi currency",
    description: "Includes transactions from all pages of results",
  },
} as const;
