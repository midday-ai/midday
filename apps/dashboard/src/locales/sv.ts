export default {
  transaction_methods: {
    card_purchase: "Kortbetalning",
    payment: "Betalning",
    card_atm: "Kort bankomat",
    transfer: "Överföring",
    other: "Annan",
    ach: "Ach",
    deposit: "Deposition",
    wire: "Wire",
    fee: "Avgift",
    interest: "Ränta",
  },
  language: {
    title: "Språk",
    description: "Ändra språket som används i användargränssnittet.",
    placeholder: "Välj språk",
  },
  languages: {
    en: "Engelska",
    sv: "Svenska",
  },
  timezone: {
    title: "Tidzon",
    description: "Aktuell tidzoninställning.",
    placeholder: "Välj tidzon",
  },
  inbox_filter: {
    all: "Alla",
    todo: "Att göra",
    done: "Slutförda",
  },
  spending_period: {
    last_30d: "Senaste 30 dagarna",
    this_month: "Den här månaden",
    last_month: "Förra månaden",
    this_year: "Det här året",
    last_year: "Förra året",
  },
  transactions_period: {
    all: "All",
    income: "Inkomst",
    outcome: "Utgifter",
  },
  chart_type: {
    profit: "Vinst",
    revenue: "Omsättning",
    burn_rate: "Brännhastighet",
  },
  folders: {
    all: "Alla",
    exports: "Exporteringar",
    inbox: "Inkorg",
    imports: "Importer",
    transactions: "Transaktioner",
    invoices: "Fakturor",
  },
  mfa_status: {
    verified: "Verifierad",
    unverified: "Overifierad",
  },
  roles: {
    owner: "Ägare",
    member: "Medlem",
  },
  tracker_status: {
    in_progress: "Pågående",
    completed: "Färdig",
  },
  account_balance: {
    total_balance: "Total saldo",
  },
} as const;
