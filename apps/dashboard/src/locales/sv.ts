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
  transaction_categories: {
    // Parent Categories
    revenue: "Intäkter och pengar från verksamheten",
    "cost-of-goods-sold":
      "Direkta kostnader för att producera varor eller tjänster",
    "sales-marketing":
      "Kostnader relaterade till försäljning och marknadsföring",
    operations: "Dagliga driftskostnader för att driva verksamheten",
    "professional-services":
      "Avgifter till externa experter och tjänsteleverantörer",
    "human-resources":
      "Anställdrelaterade kostnader inklusive löner, förmåner och utbildning",
    "travel-entertainment": "Affärsresor, måltider och nöjeskostnader",
    technology: "Programvara, hårdvara och teknologirelaterade kostnader",
    "banking-finance":
      "Bankavgifter, lånebetalningar och finansiella transaktioner",
    "assets-capex": "Kapitalutgifter och tillgångsförvärv",
    "liabilities-debt": "Skuldförbindelser och uppskjuten intäkt",
    taxes: "Skattebetalningar och myndighetsavgifter",
    "owner-equity": "Ägareinvesteringar, uttag och eget kapital",
    system: "Systemgenererade kategorier för okategoriserade transaktioner",

    // Child Categories - Revenue
    income: "Allmänna affärsintäkter från olika källor",
    "product-sales":
      "Intäkter från försäljning av fysiska eller digitala produkter",
    "service-revenue": "Intäkter från att tillhandahålla tjänster till kunder",
    "consulting-revenue": "Intäkter från konsulttjänster och rådgivning",
    "subscription-revenue":
      "Återkommande intäkter från prenumerationsbaserade tjänster",
    "interest-income": "Intäkter från ränta på investeringar eller lån",
    "other-income": "Diverse intäkter som inte klassificeras annorstädes",
    "customer-refunds": "Pengar återbetalda till kunder för återbetalningar",
    "chargebacks-disputes": "Intäktsjusteringar från betalningsdispyt",

    // Child Categories - Cost of Goods Sold
    inventory: "Kostnad för varor som hålls för försäljning",
    manufacturing: "Produktionskostnader för tillverkning av varor",
    "shipping-inbound": "Kostnader för att ta emot varor och material",
    "duties-customs": "Importtullar och tullavgifter",

    // Child Categories - Sales & Marketing
    marketing: "Marknadsföringskampanjer och promotionskostnader",
    advertising: "Betalda annonser och mediaplaceringar",
    website: "Webbplatsutveckling, hosting och underhåll",
    events: "Mässor, konferenser och evenemangskostnader",
    "promotional-materials":
      "Broschyrer, visitkort och marknadsföringsmaterial",

    // Child Categories - Operations
    "office-supplies": "Kontorsmaterial och pappersvaror",
    rent: "Kontor, lager eller utrustningshyra",
    utilities: "El, vatten, gas och andra räkningar",
    "facilities-expenses": "Byggnadsunderhåll och anläggningskostnader",
    equipment: "Icke-kapitalutrustning och underhåll",
    "internet-and-telephone": "Internet, telefon och kommunikationstjänster",
    shipping: "Utgående frakt och leveranskostnader",

    // Child Categories - Professional Services
    "professional-services-fees": "Juridiska, redovisnings- och konsultarvoden",
    contractors: "Betalningar till oberoende entreprenörer och frilansare",
    insurance: "Företagsförsäkringspremier och täckning",

    // Child Categories - Human Resources
    salary: "Anställdas löner och arvoden",
    training: "Anställdas utbildning och utvecklingskostnader",
    "employer-taxes": "Arbetsgivaravgifter och bidrag",
    benefits: "Anställdas förmåner och sjukförsäkring",

    // Child Categories - Travel & Entertainment
    travel: "Affärsresekostnader inklusive transport",
    meals: "Affärsmåltider och middagskostnader",
    activity: "Nöjes- och teambuildingaktiviteter",

    // Child Categories - Technology
    software: "Programvarulicenser och prenumerationer",
    "non-software-subscriptions": "Icke-programvaruprenumerationer",

    // Child Categories - Banking & Finance
    transfer: "Banköverföringar mellan konton",
    "credit-card-payment":
      "Betalningar till kreditkort. Exkluderas från rapporter för att undvika dubbelräkning",
    "banking-fees": "Bankkontounderhåll och transaktionsavgifter",
    "loan-proceeds": "Pengar mottagna från lån och finansiering",
    "loan-principal-repayment": "Huvudstolsbetalningar på lån",
    "interest-expense": "Ränta betalad på lån och kredit",
    payouts: "Betalningsplattformsutbetalningar till företaget",
    "processor-fees": "Betalningsbehandling och transaktionsavgifter",
    fees: "Allmänna bank- och finansiella avgifter",

    // Child Categories - Assets
    "fixed-assets": "Långsiktiga tillgångar som byggnader och utrustning",
    "prepaid-expenses": "Förhandsbetalningar för framtida tjänster",

    // Child Categories - Liabilities & Debt
    leases: "Utrustnings- och fastighetsleasingsbetalningar",
    "deferred-revenue": "Förhandsbetalningar mottagna för framtida tjänster",

    // Child Categories - Taxes & Government
    "vat-gst-pst-qst-payments":
      "Mervärdesskatt och försäljningsskattebetalningar",
    "sales-use-tax-payments":
      "Försäljnings- och användningsskatteförpliktelser",
    "income-tax-payments": "Inkomstskattebetalningar och avbetalningar",
    "payroll-tax-remittances": "Anställdas skatteavdrag och remitteringar",
    "government-fees": "Myndighetslicensiering och regelverksavgifter",

    // Child Categories - Owner / Equity
    "owner-draws": "Pengar som dras av företagsägare",
    "capital-investment": "Ägareinvesteringar i företaget",
    "charitable-donations": "Välgörenhetsbidrag och donationer",

    // Child Categories - System
    uncategorized: "Transaktioner som inte har klassificerats ännu",
    other: "Diverse transaktioner som inte passar in i andra kategorier",
    "internal-transfer":
      "Överföringar mellan egna konton. Exkluderas från rapporter för att undvika dubbelräkning",
  },
} as const;
