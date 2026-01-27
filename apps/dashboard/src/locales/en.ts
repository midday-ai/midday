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
  locale: {
    title: "Locale",
    searchPlaceholder: "Search locale",
    description:
      "Sets the region and language preferences for currency, dates, and other locale-specific formats.",
    placeholder: "Select locale",
  },
  languages: {
    en: "English",
    sv: "Swedish",
  },
  timezone: {
    title: "Time Zone",
    searchPlaceholder: "Search timezone",
    description:
      "Defines the default time zone used for displaying times in the app.",
    placeholder: "Select timezone",
  },
  spending_period: {
    last_30d: "Last 30 days",
    this_month: "This month",
    last_month: "Last month",
    this_year: "This year",
    last_year: "Last year",
  },
  widget_period: {
    fiscal_ytd: "Fiscal YTD",
    fiscal_year: "Fiscal Year",
    current_quarter: "Current Quarter",
    trailing_12: "Last 12 Months",
    current_month: "Current Month",
  },
  transactions_period: {
    all: "All",
    income: "Income",
    expense: "Expense",
  },
  transaction_frequency: {
    weekly: "Weekly recurring",
    monthly: "Monthly recurring",
    annually: "Annually recurring",
  },
  inbox_filter: {
    all: "All",
    todo: "Todo",
    done: "Done",
  },
  chart_type: {
    profit: "Profit",
    revenue: "Revenue",
    expense: "Expenses",
    burn_rate: "Burn rate",
  },
  folders: {
    all: "All",
    exports: "Exports",
    inbox: "Inbox",
    imports: "Imports",
    transactions: "Transactions",
    invoices: "Invoices",
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
    categories: {
      transactions: "Transactions",
      invoices: "Invoices",
      inbox: "Inbox",
      insights: "Insights",
    },
    transactions_created: {
      name: "New Transactions",
      description: "Get notified when new transactions are imported",
      "title#one": "New transaction from {name} {amount} on {date}",
      "title#other": "{count} new transactions added",
      "title_many#other": "{count} transactions imported",
      single_transaction: "New transaction from {name} {amount} on {date}",
    },
    invoice_paid: {
      name: "Paid",
      description: "Get notified when invoices are paid",
      title: "Invoice payment received",
      subtitle: "Your invoice has been paid",
      manual_with_date:
        "Invoice {invoiceNumber} from {customerName} marked as paid on {date}",
      manual_with_date_no_customer:
        "Invoice {invoiceNumber} marked as paid on {date}",
      manual: "Invoice {invoiceNumber} from {customerName} marked as paid",
      manual_no_customer: "Invoice {invoiceNumber} marked as paid",
      automatic: "Payment received for invoice {invoiceNumber}",
    },
    invoice_overdue: {
      name: "Overdue",
      description: "Get notified when invoices become overdue",
      title: "Invoice is overdue",
      subtitle: "Payment is past due date",
      with_number: "Invoice {invoiceNumber} is now overdue",
    },
    invoice_scheduled: {
      name: "Scheduled",
      description: "Get notified when invoices are scheduled for sending",
      title: "Invoice scheduled",
      subtitle: "Invoice has been scheduled for automatic delivery",
      with_customer:
        "Invoice {invoiceNumber} scheduled to be sent to {customerName} on {date} at {time}",
      without_customer:
        "Invoice {invoiceNumber} scheduled for {date} at {time}",
      simple: "Invoice {invoiceNumber} has been scheduled",
    },
    invoice_sent: {
      name: "Sent",
      description: "Get notified when invoices are successfully sent",
      title: "Invoice sent",
      subtitle: "Invoice has been delivered to customer",
      with_customer: "Invoice {invoiceNumber} sent to {customerName}",
      without_customer: "Invoice {invoiceNumber} has been sent",
    },
    invoice_reminder_sent: {
      name: "Reminder Sent",
      description: "Get notified when invoice reminders are sent",
      title: "Invoice reminder sent",
      subtitle: "Payment reminder has been sent to customer",
      with_customer:
        "Payment reminder sent to {customerName} for invoice {invoiceNumber}",
      without_customer: "Payment reminder sent for invoice {invoiceNumber}",
    },

    invoice_cancelled: {
      name: "Cancelled",
      description: "Get notified when invoices are cancelled",
      title: "Invoice cancelled",
      subtitle: "Invoice has been cancelled",
      with_customer:
        "Invoice {invoiceNumber} for {customerName} has been cancelled",
      without_customer: "Invoice {invoiceNumber} has been cancelled",
    },
    invoice_created: {
      name: "Created",
      description: "Get notified when new invoices are created",
      title: "Invoice created",
      subtitle: "A new invoice has been created",
      with_customer_and_amount:
        "Invoice {invoiceNumber} created for {customerName} - {amount}",
      with_customer: "Invoice {invoiceNumber} created for {customerName}",
      without_customer: "Invoice {invoiceNumber} has been created",
    },
    invoice_refunded: {
      name: "Refunded",
      description: "Get notified when invoice payments are refunded",
      title: "Invoice refunded",
      subtitle: "Invoice payment has been refunded",
      with_customer:
        "Invoice {invoiceNumber} for {customerName} has been refunded",
      without_customer: "Invoice {invoiceNumber} has been refunded",
    },
    recurring_series_started: {
      name: "Recurring Series Started",
      description: "Get notified when a new recurring invoice series begins",
      title: "Recurring invoice series started",
      with_customer_and_count:
        "Started {frequency} recurring series for {customerName} ({count} invoices)",
      with_customer: "Started {frequency} recurring series for {customerName}",
      with_frequency: "Started {frequency} recurring invoice series",
    },
    recurring_series_completed: {
      name: "Recurring Series Completed",
      description: "Get notified when a recurring invoice series finishes",
      title: "Recurring invoice series completed",
      with_customer_and_count:
        "Recurring series for {customerName} completed ({count} invoices generated)",
      with_count:
        "Recurring invoice series completed ({count} invoices generated)",
    },
    recurring_series_paused: {
      name: "Recurring Series Paused",
      description: "Get notified when a recurring invoice series is paused",
      title: "Recurring invoice series paused",
      with_customer: "Recurring series for {customerName} has been paused",
      auto_failure_with_customer:
        "Recurring series for {customerName} paused after {failureCount} failed attempts",
      auto_failure:
        "Recurring series paused after {failureCount} failed attempts",
    },
    recurring_invoice_upcoming: {
      name: "Upcoming Recurring Invoice",
      description:
        "Get notified 24 hours before a recurring invoice is generated",
      title: "Upcoming invoice generation",
      batch: "You have {count} invoice(s) scheduled for tomorrow",
      single_with_details:
        "A {amount} invoice for {customerName} is scheduled for tomorrow",
      single_with_customer:
        "An invoice for {customerName} is scheduled for tomorrow",
    },
    inbox_new: {
      name: "New Inbox Items",
      description: "Get notified when new items arrive in your inbox",
      "type.email#one": "New document received via team inbox email",
      "type.email#other": "{count} new documents received via team inbox email",
      "type.sync#one": "New document synced from your {provider} account",
      "type.sync#other":
        "{count} new documents synced from your {provider} account",
      "type.slack#one": "New document shared via Slack",
      "type.slack#other": "{count} new documents shared via Slack",
      "type.upload#one": "New document uploaded to your inbox",
      "type.upload#other": "{count} new documents uploaded to your inbox",
      // Fallback titles (shouldn't be used with new implementation)
      "title#one": "We found a new document in your inbox",
      "title#other": "We found {count} new documents in your inbox",
      "upload_title#one": "A new document was uploaded to your inbox",
      "upload_title#other": "{count} new documents were uploaded to your inbox",
    },
    inbox_auto_matched: {
      name: "Auto-matched",
      description:
        "Get notified when documents are automatically matched with transactions",
      title: "Document automatically matched",
      with_details:
        '"{documentName}" ({amount}) was matched with "{transactionName}"',
      with_names: '"{documentName}" was matched with "{transactionName}"',
      cross_currency_details:
        '"{documentName}" ({documentAmount}) was matched with "{transactionName}" ({transactionAmount}) across currencies',
    },
    inbox_high_confidence: {
      name: "High Confidence Match",
      description:
        "Get notified when high-confidence matches are found that likely need confirmation",
      title: "Likely match found",
      with_details:
        '"{documentName}" ({amount}) looks like it matches "{transactionName}" — click to review',
      with_names:
        '"{documentName}" looks like it matches "{transactionName}" — click to review',
      cross_currency_details:
        '"{documentName}" ({documentAmount}) might match "{transactionName}" ({transactionAmount}) across currencies — click to review',
    },
    inbox_needs_review: {
      name: "Needs Review",
      description:
        "Get notified when potential matches are found that need your review",
      title: "Possible match found",
      with_details:
        '"{documentName}" ({amount}) might match "{transactionName}" — click to review',
      with_names:
        '"{documentName}" might match "{transactionName}" — click to review',
      high_confidence_details:
        '"{documentName}" ({amount}) looks like it matches "{transactionName}" — click to review',
      high_confidence_names:
        '"{documentName}" looks like it matches "{transactionName}" — click to review',
      cross_currency_high_confidence:
        '"{documentName}" ({documentAmount}) looks like it matches "{transactionName}" ({transactionAmount}) across currencies — click to review',
      cross_currency_suggested:
        '"{documentName}" ({documentAmount}) might match "{transactionName}" ({transactionAmount}) across currencies — click to review',
    },
    inbox_cross_currency_matched: {
      name: "Cross-currency Match",
      description:
        "Get notified when documents are matched with transactions in different currencies",
      title: "Cross-currency match found",
      with_details:
        '"{documentName}" ({documentAmount}) might match "{transactionName}" ({transactionAmount}) across currencies — click to review',
      with_names:
        '"{documentName}" might match "{transactionName}" across currencies — click to review',
      high_confidence_details:
        '"{documentName}" ({documentAmount}) looks like it matches "{transactionName}" ({transactionAmount}) across currencies — click to review',
      high_confidence_names:
        '"{documentName}" looks like it matches "{transactionName}" across currencies — click to review',
    },
    insight_ready: {
      name: "Weekly Insights",
      description: "Get notified when your weekly business insights are ready",
      title: "Your weekly insights are ready",
      with_period: "Your {periodLabel} insights are ready",
    },
    default: {
      title: "New activity detected",
    },
    archive_button: "Archive notification",
    time_ago: "{time} ago",
  },
  widgets: {
    insights: "Assistant",
    inbox: "Inbox",
    spending: "Spending",
    transactions: "Transactions",
    tracker: "Tracker",
  },
  account_type: {
    depository: "Depository",
    credit: "Credit",
    other_asset: "Other Asset",
    loan: "Loan",
    other_liability: "Other Liability",
  },
  tags: {
    bylaws: "Bylaws",
    shareholder_agreements: "Shareholder Agreements",
    board_meeting: "Board Meeting",
    corporate_policies: "Corporate Policies",
    annual_reports: "Annual Reports",
    budget_reports: "Budget Reports",
    audit_reports: "Audit Reports",
    tax_returns: "Tax Returns",
    invoices_and_receipts: "Invoices & Receipts",
    employee_handbook: "Employee Handbook",
    payroll_records: "Payroll Records",
    performance_reviews: "Performance Reviews",
    employee_training_materials: "Employee Training Materials",
    benefits_documentation: "Benefits Documentation",
    termination_letters: "Termination Letters",
    patents: "Patents",
    trademarks: "Trademarks",
    copyrights: "Copyrights",
    client_contracts: "Client Contracts",
    financial_records: "Financial Records",
    compliance_reports: "Compliance Reports",
    regulatory_filings: "Regulatory Filings",
    advertising_copy: "Advertising Copy",
    press_releases: "Press Releases",
    branding_guidelines: "Branding Guidelines",
    market_research_reports: "Market Research Reports",
    campaign_performance_reports: "Campaign Performance Reports",
    customer_surveys: "Customer Surveys",
    quality_control_reports: "Quality Control Reports",
    inventory_reports: "Inventory Reports",
    maintenance_logs: "Maintenance Logs",
    production_schedules: "Production Schedules",
    vendor_agreements: "Vendor Agreements",
    supplier_agreements: "Supplier Agreements",
    sales_contracts: "Sales Contracts",
    sales_reports: "Sales Reports",
    client_proposals: "Client Proposals",
    customer_order_forms: "Customer Order Forms",
    sales_presentations: "Sales Presentations",
    data_security_plans: "Data Security Plans",
    system_architecture_diagrams: "System Architecture Diagrams",
    incident_response_plans: "Incident Response Plans",
    user_manuals: "User Manuals",
    software_licenses: "Software Licenses",
    data_backup_logs: "Data Backup Logs",
    project_plans: "Project Plans",
    task_lists: "Task Lists",
    risk_management_plans: "Risk Management Plans",
    project_status_reports: "Project Status Reports",
    meeting_agendas: "Meeting Agendas",
    lab_notebooks: "Lab Notebooks",
    experiment_results: "Experiment Results",
    product_design_documents: "Product Design Documents",
    prototypes_and_models: "Prototypes & Models",
    testing_reports: "Testing Reports",
    newsletters: "Newsletters",
    email_correspondence: "Email Correspondence",
    support_tickets: "Support Tickets",
    faqs_and_knowledge: "FAQs & Knowledge",
    user_guides: "User Guides",
    warranty_information: "Warranty Information",
    swot_analysis: "SWOT Analysis",
    strategic_objectives: "Strategic Objectives",
    roadmaps: "Roadmaps",
    competitive_analysis: "Competitive Analysis",
    safety_data_sheets: "Safety Data Sheets",
    compliance_certificates: "Compliance Certificates",
    incident_reports: "Incident Reports",
    emergency_response_plans: "Emergency Response Plans",
    certification_records: "Certification Records",
    training_schedules: "Training Schedules",
    e_learning_materials: "E-learning Materials",
    competency_assessment_forms: "Competency Assessment Forms",
  },
  invoice_status: {
    draft: "Draft",
    overdue: "Overdue",
    paid: "Paid",
    unpaid: "Unpaid",
    canceled: "Canceled",
    scheduled: "Scheduled",
    refunded: "Refunded",
  },
  payment_status: {
    none: "Unknown",
    good: "Good",
    average: "Average",
    bad: "Bad",
  },
  payment_status_description: {
    none: "No payment history yet",
    good: "Consistently pay on time",
    average: "Mostly on time",
    bad: "Room for improvement",
  },
  "invoice_count#zero": "No invoices",
  "invoice_count#one": "1 invoice",
  "invoice_count#other": "{count} invoices",
  account_balance: {
    total_balance: "Total balance",
  },
  transaction_categories: {
    // Parent Categories
    revenue: "Income and money received from business activities",
    "cost-of-goods-sold":
      "Direct costs associated with producing goods or services",
    "sales-marketing":
      "Expenses related to sales activities and marketing efforts",
    operations: "Day-to-day operational costs of running the business",
    "professional-services":
      "Fees paid to external professionals and service providers",
    "human-resources":
      "Employee-related costs including salaries, benefits, and training",
    "travel-entertainment":
      "Business travel, meals, and entertainment expenses",
    technology: "Software, hardware, and technology-related expenses",
    "banking-finance":
      "Banking fees, loan payments, and financial transactions",
    "assets-capex": "Capital expenditures and asset acquisitions",
    "liabilities-debt": "Debt obligations and deferred revenue",
    taxes: "Tax payments and government fees",
    "owner-equity": "Owner investments, draws, and equity transactions",
    system: "System-generated categories for uncategorized transactions",

    // Child Categories - Revenue
    income: "General business income from various sources",
    "product-sales": "Revenue from selling physical or digital products",
    "service-revenue": "Income from providing services to customers",
    "consulting-revenue": "Revenue from consulting and advisory services",
    "subscription-revenue": "Recurring income from subscription-based services",
    "interest-income": "Earnings from interest on investments or loans",
    "other-income": "Miscellaneous income not classified elsewhere",
    "customer-refunds": "Money returned to customers for refunds",
    "chargebacks-disputes": "Revenue adjustments from payment disputes",

    // Child Categories - Cost of Goods Sold
    inventory: "Cost of goods held for sale",
    manufacturing: "Production costs for manufacturing goods",
    "shipping-inbound": "Costs for receiving goods and materials",
    "duties-customs": "Import duties and customs fees",

    // Child Categories - Sales & Marketing
    marketing: "Marketing campaign and promotional expenses",
    advertising: "Paid advertising and media placement costs",
    website: "Website development, hosting, and maintenance",
    events: "Trade shows, conferences, and event expenses",
    "promotional-materials":
      "Brochures, business cards, and marketing materials",

    // Child Categories - Operations
    "office-supplies": "Office materials and stationery",
    rent: "Office, warehouse, or equipment rental costs",
    utilities: "Electricity, water, gas, and other utility bills",
    "facilities-expenses": "Building maintenance and facility costs",
    equipment: "Non-capital equipment purchases and maintenance",
    "internet-and-telephone": "Internet, phone, and communication services",
    shipping: "Outbound shipping and delivery costs",

    // Child Categories - Professional Services
    "professional-services-fees": "Legal, accounting, and consulting fees",
    contractors: "Payments to independent contractors and freelancers",
    insurance: "Business insurance premiums and coverage",

    // Child Categories - Human Resources
    salary: "Employee wages and salaries",
    training: "Employee training and development costs",
    "employer-taxes": "Payroll taxes and employer contributions",
    benefits: "Employee benefits and health insurance",

    // Child Categories - Travel & Entertainment
    travel: "Business travel expenses including transportation",
    meals: "Business meal and dining expenses",
    activity: "Entertainment and team building activities",

    // Child Categories - Technology
    software: "Software licenses and subscriptions",
    "non-software-subscriptions": "Non-software subscription services",

    // Child Categories - Banking & Finance
    transfer: "Bank transfers between accounts",
    "credit-card-payment":
      "Payments to credit cards. Excluded from reports to avoid double-counting expenses",
    "banking-fees": "Bank account maintenance and transaction fees",
    "loan-proceeds": "Money received from loans and financing",
    "loan-principal-repayment": "Principal payments on loans",
    "interest-expense": "Interest paid on loans and credit",
    payouts: "Payment platform payouts to business",
    "processor-fees": "Payment processing and transaction fees",
    fees: "General banking and financial fees",

    // Child Categories - Assets
    "fixed-assets": "Long-term assets like buildings and equipment",
    "prepaid-expenses": "Advance payments for future services",

    // Child Categories - Liabilities & Debt
    leases: "Equipment and property lease payments",
    "deferred-revenue": "Advance payments received for future services",

    // Child Categories - Taxes & Government
    "vat-gst-pst-qst-payments": "Value-added tax and sales tax payments",
    "sales-use-tax-payments": "Sales and use tax obligations",
    "income-tax-payments": "Income tax payments and installments",
    "payroll-tax-remittances": "Employee tax withholdings and remittances",
    "government-fees": "Government licensing and regulatory fees",

    // Child Categories - Owner / Equity
    "owner-draws": "Money withdrawn by business owners",
    "capital-investment": "Owner investments in the business",
    "charitable-donations": "Charitable contributions and donations",

    // Child Categories - System
    uncategorized: "Transactions that haven't been classified yet",
    other: "Miscellaneous transactions not fitting other categories",
    "internal-transfer":
      "Transfers between your own accounts. Excluded from reports to avoid double-counting",
  },
  tax_summary: {
    title: {
      vat: "VAT Summary",
      gst: "GST Summary",
      sales_tax: "Sales Tax Summary",
      default: "Tax Summary",
    },
    collected: {
      vat: "VAT collected",
      gst: "GST collected",
      sales_tax: "Sales tax collected",
      default: "Tax collected",
    },
    paid: {
      vat: "VAT paid",
      gst: "GST paid",
      sales_tax: "Tax on purchases",
      default: "Tax paid",
    },
    to_remit: "To Remit",
    credit: "Credit",
    no_activity: "No tax activity",
    balanced: "Balanced",
    year_to_date: "Year-to-date ({year})",
    remit_amount: "{amount} to remit",
    credit_amount: "{amount} credit",
    open_assistant: "Open taxes assistant",
  },
  overdue_invoices: {
    title: "Overdue Invoices",
    all_paid: "All invoices paid on time",
    "description#one": "{count} invoice · Oldest {days} {dayText} overdue",
    "description#other": "{count} invoices · Oldest {days} {dayText} overdue",
    "day#one": "day",
    "day#other": "days",
    view_overdue: "View overdue invoices",
  },
  billable_hours: {
    title: "Billable Hours",
    no_hours: "No billable hours tracked",
    "description#one": "{hours} hour tracked",
    "description#other": "{hours} hours tracked",
    "hour#one": "hour",
    "hour#other": "hours",
    view_tracker: "View time tracker",
  },
} as const;
